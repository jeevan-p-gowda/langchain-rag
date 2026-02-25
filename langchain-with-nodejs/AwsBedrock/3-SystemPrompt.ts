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

const config = {
    context: {
        user: {
            id: 1,
        },
    }
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

// 1. Define the system prompt
const systemPrompt = `You are an expert weather forecaster.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location first. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;

const agent = createAgent({
    model: model,
    tools: [getWeather, getTime, getUserLocation],
    systemPrompt: systemPrompt, // 2. Pass the system prompt to the agent
});

const response = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather and time ?" }]
}, config);

const aiResponse = response.messages[response.messages.length - 1].content;

console.log(aiResponse);

/**
 * Based on your location in India:

**Weather:** It's sunny in India ☀️

**Time:** It's currently 1:23:55 PM in India

Perfect weather for being outdoors! Is there anything specific about the weather conditions you'd like to know more about?
 */
