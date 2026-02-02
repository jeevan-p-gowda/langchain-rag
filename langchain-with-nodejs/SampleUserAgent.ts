import { createAgent } from "langchain";
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import "dotenv/config";

const bedrockClient = new BedrockRuntimeClient({ profile: process.env.AWS_PROFILE });

const model = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    region: process.env.AWS_REGION,
    temperature: 0.2,
    maxTokens: 4000,
    client: bedrockClient
});

const agent = createAgent({
    model: model,
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "What is 2+2 ?" }]
});

const aiResponse = response.messages[response.messages.length - 1].content;

console.log(aiResponse);