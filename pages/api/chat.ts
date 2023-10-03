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
  const { question, history, token } = req.body;
  console.log("history is:", history)

  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');
  let answer
  let sourceDocs

  try {
    answer = ""
    const response = await fetch("https://dexter.eastus.cloudapp.azure.com/dexter/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: sanitizedQuestion }),
    });
    console.log(question)
    if (response.status === 422) {
      const responseBody = await response.text();
      console.log("422", responseBody)
    }
    if (response.ok) {
      const responseBody = await response.json();
      sourceDocs = responseBody.sources
      answer = responseBody.answer
      console.log(responseBody);
    } else {
      console.log("Failed to call llama");
    }
  } catch (error) {
    console.error("Error calling llama:", error);
  }


  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  const index = pinecone.Index(PINECONE_INDEX_NAME);




  /* create vectorstore*/
  /* const vectorStore = await PineconeStore.fromExistingIndex(
     new OpenAIEmbeddings({}),
     {
       pineconeIndex: index,
       textKey: 'text',
       namespace: PINECONE_NAME_SPACE,
     },
   );*/

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };


  //sendData(JSON.stringify({ data: '' }));

  //create chain
  sendData(JSON.stringify({ data: answer }));
  /* const chain = makeChain(vectorStore, (token: string) => {
     //sendData(JSON.stringify({ data: token }));
   });*/


  try {
    // Ask a question
    /*const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });*/

    // Process the response and send user data


    // console.log("User input is: ", question);
    //console.log(response.sourceDocuments);


    try {

      const user_input = question;
      const model_output = answer;
      const user_feedback = 'NA';

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
    sendData(JSON.stringify({ sourceDocs: sourceDocs }));

  } catch (error) {
    console.log('error', error);
  } finally {

    sendData('[DONE]');

    answer = "";
    res.end();
  }

}

