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
  `You are an AI assistant for Galy providing helpful answers to questions generally about cellular agriculture. Some background: Galy is growing the future. We are an army of dreamers that believe scientists are artists of a new era. 
  We are envisioning a world where we can still produce sought-after materials without the physical turmoil we place on disadvantaged people and the planet. That is why we are revolutionizing the way we produce goods today and therefore sparking a much more sustainable form of doing agriculture. 
  However, nobody takes innovation seriously until you scale it. We are on it! By developing intelligent scale-up strategies with cotton cells, as the in-vitro cotton production market has never been done on an industrial scale, we are capable of doing something truly new.
  With this mind, we gather a team of highly diverse subjects, ranging from genetic engineering, plant cell culture, bioreactor development, mathematics, statistics, designers, high-performance automation, stylists, illustrators, creative business development, marketing and branding strategies.
  A group with a strong sense of purpose on a mission to find ways to save our planet. Galy is located in the United States and Brazil and the CEO is Luciano Bueno.

You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
If you can't find the answer in the context below, just say "Hmm, I'm not sure." Don't try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

Question: {question}
=========
{context}
=========
Answer in Markdown:`,
);

export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-4', 
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
              console.log(token);
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
