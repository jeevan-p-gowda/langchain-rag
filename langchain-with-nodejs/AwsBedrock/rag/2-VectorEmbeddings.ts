import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { BedrockEmbeddings } from "@langchain/aws";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";

const loader = new PDFLoader("docs/nke-10k-2023.pdf")
const docs = await loader.load()
console.log(docs.length);

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await textSplitter.splitDocuments(docs);
console.log(chunks.length);

// 1. Model which will be used to embed the chunks
const embeddings = new BedrockEmbeddings({
    model: "amazon.titan-embed-text-v1",
    region: process.env.AWS_REGION,
});

// 2. Vector store which will be used to store the chunks
const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(chunks);

// 3. Similarity search - which will be used to search the vector store and get all the similar results
const similaritySearchResults = await vectorStore.similaritySearch("What is the number of pages in the document?");
console.log(similaritySearchResults);

// 4. MMR - Maximum marginal relevance search - which will be used to search the vector store and get the most relevant results
const retriever = vectorStore.asRetriever({
    searchType: "mmr",
    searchKwargs: {
        fetchK: 10, // 5. Retrieves the top 10 relevant documents
    },
});
