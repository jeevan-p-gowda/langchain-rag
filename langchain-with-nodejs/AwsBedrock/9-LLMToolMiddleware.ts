import { createAgent, tool, llmToolSelectorMiddleware } from "langchain";
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

const search = tool((query) => {
    return `Searching the web for ${query}, Found 5 results`;
}, {
    name: "search",
    description: "Search the web for a given query",
    schema: z.object({
        query: z.string().describe("The query to search the web for"),
    }),
});

const sendEmail = tool((input) => {
    return `Email sent to ${input.email} with subject ${input.subject} and body ${input.body}`;
}, {
    name: "send_email",
    description: "Send an email to a given email address",
    schema: z.object({
        email: z.string().describe("The email address to send the email to"),
        subject: z.string().describe("The subject of the email"),
        body: z.string().describe("The body of the email"),
    }),
});

const agent = createAgent({
    model: model,
    tools: [search, sendEmail],
    middleware: [llmToolSelectorMiddleware({
        model: "gpt-4o-mini",
        maxTools: 2 // 1. The maximum number of tools to be used
    })]
});

const response = await agent.invoke({
    messages: [{
        role: "user",
        content: "Search the web for 'latest news' and send an email to john.doe@example.com with the subject 'Latest News' and the body 'Here are the latest news'"
    }]
});

console.log(response);