import { createAgent, createMiddleware, tool } from "langchain";
import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";
import "dotenv/config";
import { MemorySaver } from "@langchain/langgraph";

const bedrockClient = new BedrockRuntimeClient({ profile: process.env.AWS_PROFILE });

const model = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    region: process.env.AWS_REGION,
    temperature: 0.2,
    maxTokens: 4000,
    client: bedrockClient
});

// For example, same model as been used for both base and advanced model
// but you can use different models for different purposes
const baseModel = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    region: process.env.AWS_REGION,
    temperature: 0.2,
    maxTokens: 4000,
    client: bedrockClient
});

const advancedModel = new ChatBedrockConverse({
    model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    region: process.env.AWS_REGION,
    temperature: 0.2,
    maxTokens: 4000,
    client: bedrockClient
});

// 1. Define the middleware
const dynamicModelSelector = createMiddleware({
    name: 'DynamicModelSelector',
    wrapModelCall: (request, handler) => {
        const messageCount = request.messages.length;
        return handler({
            ...request,
            model: messageCount > 10 ? advancedModel : baseModel, // 3. Select the model based on the message count
        });
    }
});

const config = {
    configurable: { thread_id: "1" },
    context: {
        user: {
            id: 2,
        },
    },
    db: {}
}

const qaConfig = {
    configurable: { thread_id: "2" },
    context: {
        user: {
            id: 2,
        },
    },
    db: {}
}

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

const responseFormat = z.object({
    humour_response: z.string().describe("The weather for the given city"),
    time: z.string().describe("The time for the given city"),
    weather_condition: z.string().describe("The weather condition for the given city"),
});

const memory = new MemorySaver();

const systemPrompt = `You are an expert weather forecaster.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location first. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;

const agent = createAgent({
    model: model,
    tools: [getWeather, getTime, getUserLocation],
    systemPrompt: systemPrompt,
    responseFormat: responseFormat,
    checkpointer: memory,
    middleware: [dynamicModelSelector] as const, // 2. Pass the middleware to the agent
});

const response1 = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather and time ?" }]
}, config);

console.log(response1);

const response2 = await agent.invoke({
    messages: [{ role: "user", content: "What was the weather and time for the city you found out ?" }]
}, qaConfig);

console.log(response2);

const response3 = await agent.invoke({
    messages: [{ role: "user", content: "Suggest me some good places to visit ?" }]
}, config);

console.log(response3);