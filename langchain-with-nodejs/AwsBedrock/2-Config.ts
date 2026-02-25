import { createAgent, tool } from "langchain";
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

// 1. Define the config for the agent
const config = {
    context: {
        user: {
            id: 1,
        },
    }
}

// 3. Pass the config to the tool
const getUserLocation = tool((_, config) => {
    const user_id = config.context.user.id;
    return user_id === 1 ? "India" : "USA";
}, {
    name: "getUserLocation",
    description: "Get the user's location",
    schema: z.object({}),
});

const getWeather = tool((input) => {
    return `Its sunny in ${input.city}`;
}, {
    name: "getWeather",
    description: "Get the weather for a given city",
    schema: z.object({
        city: z.string().describe("The city to get the weather for"),
    }),
});

const getTime = tool((input) => {
    return `Its ${new Date().toLocaleTimeString()} in ${input.city}`;
}, {
    name: "getTime",
    description: "Get the time for a given city",
    schema: z.object({
        city: z.string().describe("The city to get the time for"),
    }),
});

const agent = createAgent({
    model: model,
    tools: [getWeather, getTime, getUserLocation],
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather and time ?" }]
}, config); // 2. Pass the config to the agent

const aiResponse = response.messages[response.messages.length - 1].content;

console.log(aiResponse);

/**
 * Based on your location in India:

**Weather:** It's sunny in India ☀️

**Time:** It's currently 1:21:26 PM in India 🕐

Have a great day!*/