import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

//Recibe el stopGenerating

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history, token, stopGenerating } = req.body;


  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  const index = pinecone.Index(PINECONE_INDEX_NAME);

  /* create vectorstore*/
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({}),
    {
      pineconeIndex: index,
      textKey: 'text',
      namespace: PINECONE_NAME_SPACE,
    },
  );

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  sendData(JSON.stringify({ data: '' }));

  //create chain

  const chain = makeChain(vectorStore, (token: string) => {
    sendData(JSON.stringify({ data: token }));
  });


  try {

    // Ask a question
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    // Process the response and send user data
    const user_input = question;
    const model_output = response.text;
    const user_feedback = 'NA';

    console.log("User input is: ", question);
    console.log("Model output is:", model_output);
    console.log('Stop generating is:', req.body.stopGenerating);


    try {
      const response = await fetch("https://dexterv2-16d166718906.herokuapp.com/collect-user-input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_input, model_output, user_feedback }),
      });

      if (response.ok) {
        const responseBody = await response.json();
        console.log(responseBody);
      } else {
        console.log("Failed to store user data");
      }
    } catch (error) {
      console.error("Error submitting analytics:", error);
    }

    // Send source documents back to the client
    sendData(JSON.stringify({ sourceDocs: response.sourceDocuments }));

  } catch (error) {
    console.log('error', error);
  } finally {
    if (!stopGenerating) {
      sendData('[DONE]');

    }
    res.end();
  }

}

