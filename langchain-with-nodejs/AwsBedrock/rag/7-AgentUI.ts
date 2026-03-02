import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { createAgent } from "langchain";
import "dotenv/config";

const bedrockClient = new BedrockRuntimeClient({ profile: process.env.AWS_PROFILE });

const model = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    region: process.env.AWS_REGION,
    temperature: 0.2,
    maxTokens: 4000,
    client: bedrockClient
});

const client = new MultiServerMCPClient({
    playwright: {
        // transport: "stdio",  // Local subprocess communication
        command: "npx",
        args: ["@playwright/mcp@latest"],
    },
});

const tools = await client.getTools();

const agent = createAgent({
    model: model,
    tools: tools,
});

export const graph = agent;