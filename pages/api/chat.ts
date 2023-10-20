import type { NextApiRequest, NextApiResponse } from 'next';

import { OpenAIEmbeddings } from 'langchain/embeddings';

import { PineconeStore } from 'langchain/vectorstores';

import { makeChain } from '@/utils/makechain';

import { pinecone } from '@/utils/pinecone-client';

import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

 

export default async function handler(

  req: NextApiRequest,

  res: NextApiResponse,

) {

  const { question, history, token } = req.body;

  console.log("\n\nNew request ############################################ IN PROGRESS \n\n")

  console.log("history is:", history)

 

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  let answer:string=''

  let sourceDocs

  let tokens

 

  res.setHeader('Content-Type', 'text/event-stream');

  res.setHeader('Cache-Control', 'no-cache, no-transform');

  res.setHeader('Connection', 'keep-alive');

 

  try {

 

    const body = {

      question: sanitizedQuestion,

      history:history,

      config: {

        stream: true,

      },

    };

 

    const response = await fetch(

      "https://dexter.eastus.cloudapp.azure.com/dexter/galy",

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

        let jsonData=''

        let sourcesData=null

 

        while (true) {

          const { done, value } = await reader.read();

          if (done) {

 

            isLastEvent = true;

            break;

          }

          const text = new TextDecoder().decode(value);

          jsonData+=text;

 

          while (jsonData.includes('\n')) {

            const lineIndex = jsonData.indexOf('\n');

            const line = jsonData.slice(0, lineIndex).trim();

            jsonData = jsonData.slice(lineIndex + 1);

   

            try {

              if (line.trim() !== '' && line.startsWith('{')) {

                const lineData = JSON.parse(line);

                if (lineData.data) {

                  const data = JSON.stringify(lineData.data).replace(/^"(.*)"$/, '$1');

                  sendData(JSON.stringify({ data: data }));

                  answer+=data

                } else if (lineData.sources) {

                  sourcesData = lineData.sources;

                }

              }

            } catch (error) {

              console.error("Error parsing JSON:", error);

            }

          }

   

          if (sourcesData) {

            sourceDocs=sourcesData

            console.log("The sources data are:",sourcesData);

 

            sourcesData = null;

          }

        }

       

        if (isLastEvent) {

          isLastEvent=true;

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

 

  if (!question) {

    return res.status(400).json({ message: 'No question in the request' });

  }

  const index = pinecone.Index(PINECONE_INDEX_NAME);

 

  const sendData = (data: string) => {

    res.write(`data: ${data}\n\n`);

  };

 

  try {

 

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

 

   sendData(JSON.stringify({ sourceDocs: sourceDocs}));

 

  } catch (error) {

    console.log('error', error);

  }

answer=""

sendData("[DONE]")

res.end();

}

 

 