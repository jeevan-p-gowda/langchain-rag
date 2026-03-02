import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { createAgent, tool } from "langchain";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";
import { z } from "zod";

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
console.log(docs[0].pageContent);
console.log(docs.length);

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

const retrieve = tool(async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const docsContent = retrievedDocs.map((doc) => doc.pageContent
    ).join("\n\n");
    return docsContent;
},
    {
        name: "retrieve",
        description: "Retrieve information from multiple pdf documents",
        schema: z.object({
            query: z.string()
        })

    }

);

// 1. Initialize the MCP client
const client = new MultiServerMCPClient({
    playwright: {
        // transport: "stdio",  // Local subprocess communication
        command: "npx",
        args: ["@playwright/mcp@latest"],
    },
});

// 2. Get the tools
const tools = await client.getTools();

const agent = createAgent({
    model: model,
    tools: [...tools, retrieve] as (ClientTool | ServerTool)[],
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "How many tools are available in playwright ?" }],
});

const response2 = await agent.invoke({
    messages: [{ role: "user", content: "What is the Nike company about ?" }],
});

console.log(response.messages[response.messages.length - 1].content);
console.log(response2.messages[response2.messages.length - 1].content);