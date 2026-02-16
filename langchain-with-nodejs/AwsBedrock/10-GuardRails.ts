import { createAgent, tool, piiMiddleware } from "langchain";
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";
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
    middleware: [piiMiddleware("credit_card", {
        detector: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        strategy: "mask",
    })]
});

const response = await agent.invoke({
    messages: [{
        role: "user",
        content: "My card number is 1234-5678-9012-3456, is this VISA or MASTERCARD ?"
    }]
});

console.log(response);

// Response: My card number is ****-****-****-3456, is this VISA or MASTERCARD ?