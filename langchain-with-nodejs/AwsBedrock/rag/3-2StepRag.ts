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

const loader = new PDFLoader("docs/nke-10k-2023.pdf")
const docs = await loader.load()

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await textSplitter.splitDocuments(docs);

const embeddings = new BedrockEmbeddings({
    model: "amazon.titan-embed-text-v1",
    region: process.env.AWS_REGION,
});

const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(chunks);

// 1. Initialize the RAG middleware
const ragMiddleware = dynamicSystemPromptMiddleware(async (state) => {
    // 5. User query will get embedded along with similarity search results
    const userMessage = state.messages[0].content;
    const query = typeof userMessage === "string" ? userMessage : "";
    const searchResults = await vectorStore.similaritySearch(query, 2);
    const context = searchResults.map((result) => result.pageContent).join("\n\n");

    // 7. LLM will augment for the result with retrieved context of query and results
    return `You are a helpful assistant that can answer questions about the document.
    Here is the context: ${context}`;
});

// 2. Initialize the agent
const agent = createAgent({
    model: model,
    tools: [],
    middleware: [ragMiddleware] // 3. Pass the RAG middleware to the agent
});

// 4. Invoke the agent with the query
const response = await agent.invoke({
    messages: [{
        role: "user",
        content: "When were the Nike Executive Officers ?"
    }]
});

console.log(response.messages[response.messages.length - 1].content);