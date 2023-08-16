import { OpenAIChat } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `"You are Dexter, an AI assistant with knowledge based on the provided context about "{question}", for Galy, a company where they envision a world where we can still produce sought-after materials without the physical turmoil we place on disadvantaged people and the planet. 
  That is why they are revolutionizing the way they produce goods today and therefore sparking a much more sustainable form of doing agriculture. 
  Your goal is to provide insightful answers using this context. When addressing technical concepts, ensure elaborate explanations with examples.

Question: {question}
=========
{context}
=========
Answer in Markdown:`,
);

/*Include in-text APA citations using the relevant content provided in this prompt.
  If you don't know the answer, just say that "I don't have enough references to provide this information", don't try to make up an answer. Once you are done ask a question back to the user related to the "{question}" to create engagement and make it in BOLD.*/
export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
  stopGenerating: boolean,
) => {
  if (stopGenerating) {
    return null;
  }
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0.5 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0.5,
      modelName: 'gpt-4',

      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
          async handleLLMNewToken(token) {

            onTokenStream(token);
            console.log(token)
          },
        })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 2, //number of source documents to return
  });
};
