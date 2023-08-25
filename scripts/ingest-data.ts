import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders';
import fs from 'fs/promises'

/* Name of directory to retrieve your files from */
const filePath = 'docs';

export const clearDocsFolder = async () => {
  try {
    console.log("Clearing docs folder...")
    const files = await fs.readdir(filePath);
    for (const file of files) {
      const fullPath = `${filePath}/${file}`
      await fs.unlink(fullPath);
    }
    console.log("Deleted all documents from the docs folder");
  } catch (error) {
    console.log("Failed to delete", error);
    throw new Error("Failed to clear PDF documents from the docs folder");
  }
}

export const deleteAllVectors = async () => {
  try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    console.log("index connected");
    const namespace = "pdf-test"
    // Delete all vectors in the given namespace
    await index.delete1({
      deleteAll: true,
      namespace,
    });
    console.log('All vectors deleted from Pinecone');
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to delete all vectors from Pinecone');
  }
};

// Call the function to delete all vectors
export const run = async (apaCitation: string) => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new CustomPDFLoader(path, apaCitation),
    });


    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    // console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
    console.log('ingestion complete');
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  //await run();
  // await deleteAllVectors();
  console.log('ingestion complete');
})();
