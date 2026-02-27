import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";
import "dotenv/config";

const bedrockClient = new BedrockRuntimeClient({ profile: process.env.AWS_PROFILE });

const model = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    region: process.env.AWS_REGION,
    temperature: 0.2,
    maxTokens: 4000,
    client: bedrockClient
});

// 1. Store all the documents in an array
const pdfs = ["docs/nke-10k-2023.pdf", "docs/Nike-Inc-2025_10K.pdf", "docs/nike-growth-story.pdf"];

// 2. Initialize an array to store all the documents
const allDocs = [];

for (const pdf of pdfs) {
    const loader = new PDFLoader(pdf);
    const docs = await loader.load();
    // 3. Push the documents to the array
    allDocs.push(...docs);
}

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

// 4. Load the documents into the text splitter
const chunks = await textSplitter.splitDocuments(allDocs);

const embeddings = new BedrockEmbeddings({
    model: "amazon.titan-embed-text-v1",
    region: process.env.AWS_REGION,
});

const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(chunks);

const ragMiddleware = dynamicSystemPromptMiddleware(async (state) => {
    const userMessage = state.messages[0].content;
    const query = typeof userMessage === "string" ? userMessage : "";
    const searchResults = await vectorStore.similaritySearch(query, 2);
    const context = searchResults.map((result) => result.pageContent).join("\n\n");

    return `You are a helpful assistant that can answer questions about the document.
    Here is the context: ${context}`;
});

const agent = createAgent({
    model: model,
    tools: [],
    middleware: [ragMiddleware]
});

const response = await agent.invoke({
    messages: [{
        role: "user",
        content: "When were the Nike Executive Officers and what was the average revenue growth rate from FY05 to the end of FY09 ?"
    }]
});

console.log(response.messages[response.messages.length - 1].content);