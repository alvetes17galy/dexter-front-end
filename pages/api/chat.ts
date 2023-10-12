import type { NextApiRequest, NextApiResponse } from 'next';

import { OpenAIEmbeddings } from 'langchain/embeddings';

import { PineconeStore } from 'langchain/vectorstores';

import { makeChain } from '@/utils/makechain';

import { pinecone } from '@/utils/pinecone-client';

import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

 

let requestInProgress = false;

 

export default async function handler(

  req: NextApiRequest,

  res: NextApiResponse,

) {

  const { question, history, token } = req.body;

  console.log("history is:", history)

 

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  let answer:string=''

  let sourceDocs

  let tokens

 

  res.setHeader('Content-Type', 'text/event-stream');

  res.setHeader('Cache-Control', 'no-cache, no-transform');

  res.setHeader('Connection', 'keep-alive');

 

  try {

 

    if (requestInProgress) {

      console.log('A request is already in progress. Please wait.');

      return;

    }

 

    requestInProgress = true;

 

    const body = {

      question: sanitizedQuestion,

      config: {

        stream: true,

      },

    };

 

   

    const response = await fetch(

      "https://dexter.eastus.cloudapp.azure.com/dexter/dexter",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify(body),

      }

    );

 

    if (response.status === 422) {

      const responseBody = await response.text();

      console.log("422", responseBody);

    }

 

    if (response.ok) {

     

      if (response.body) {

        const reader = response.body.getReader();

   

        res.setHeader('Content-Type', 'text/event-stream');

        res.setHeader('Cache-Control', 'no-cache, no-transform');

        res.setHeader('Connection', 'keep-alive');

        const sendData = (data: string) => {

          res.write(`data: ${data}\n\n`);

        };

     

        let isLastEvent = false; // Initialize the flag

        let jsonData

        while (true) {

          const { done, value } = await reader.read();

          if (done) {

            // If it's the last event, set the flag to true

            isLastEvent = true;

            // Don't send the "done" event here

            break;

          }

          const text = new TextDecoder().decode(value);

         // console.log("text is:",text)

          // Split the NDJSON data into lines

          const lines = text.split('\n');

   

          for (const line of lines) {

            if (line.trim() === '') continue; // Skip empty lines

   

            try {

 

              if (line.trim() !== '' && line.startsWith('{')) {

                jsonData = JSON.parse(line);

           

                if (jsonData.data) {

                  const data = JSON.stringify(jsonData.data).replace(/^"(.*)"$/, '$1');

                  sendData(JSON.stringify({ data: data }));

                  answer += data;

                }

           

                console.log(jsonData.is_last_event);

                console.log(jsonData.sources);

              }

             

 

       

            } catch (error) {

              console.error("Error parsing JSON:", error);

            }

          }

        }

   

        // Send the "done" event if it's the last event

        if (isLastEvent) {

          console.log(jsonData.sources)

          sourceDocs=jsonData.sources

         

          isLastEvent=true;

          requestInProgress = false;

          console.log("DONE");

        }

      } else {

        console.log("Response body is null.");

      }

    } else {

      console.log("Failed to call Dexter");

    }

   

   

 

  } catch (error) {

    console.error("Error calling llama:", error);

  }

  requestInProgress = false;

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

 

 

 

  const sendData = (data: string) => {

    res.write(`data: ${data}\n\n`);

  };

 

 

  //sendData(JSON.stringify({ data: '' }));

 

  //create chain

 

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

      console.log("model answer is",answer)

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

  }

answer=""

sendData("[DONE]")

res.end();

}

 