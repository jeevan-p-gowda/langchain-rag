import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";

const loader = new PDFLoader("docs/nke-10k-2023.pdf")
const docs = await loader.load()
console.log(docs[0].pageContent);
console.log(docs.length);

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await textSplitter.splitDocuments(docs);
console.log(chunks.length);
console.log(chunks[0]);