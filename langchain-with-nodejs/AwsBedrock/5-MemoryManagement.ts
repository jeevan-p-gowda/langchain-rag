import { createAgent, tool } from "langchain";
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

const config = {
    configurable: { thread_id: "1" }, // 3. Enter the thread id
    context: {
        user: {
            id: 2,
        },
    },
    db: {}
}

const qaConfig = {
    configurable: { thread_id: "2" }, // 4. Enter the thread id
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

// 1. Define the memory
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
    checkpointer: memory, // 2. Pass the memory to the agent
});

const response1 = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather and time ?" }]
}, config);

console.log(response1.messages[response1.messages.length - 1].content);

// 6. Ask a question about the previous conversation
const response2 = await agent.invoke({
    messages: [{ role: "user", content: "What was the weather and time for the city you found out ?" }]
}, qaConfig);

console.log(response2.messages[response2.messages.length - 1].content);

// 7. Ask a question about the previous conversation
const response3 = await agent.invoke({
    messages: [{ role: "user", content: "Suggest me some good places to visit ?" }]
}, config);

console.log(response3.messages[response3.messages.length - 1].content);

/**
 * Returning structured response1: 
 * {"humour_response":"Perfect timing! It's a beautiful sunny day at 3:14:34 PM in the USA - looks like Mother Nature is showing off today! ☀️","time":"3:14:34 PM","weather_condition":"sunny"}
 */

/**
 * Returning structured response2: 
 * {"humour_response":"Well, looks like the USA is having a pretty sunny day! Though I have to say, getting weather for an entire country is like asking \"how's the food in North America?\" - it's a bit of a broad question! But hey, at least somewhere in the USA it's sunny at 3:14 PM!","time":"3:14:42 PM","weather_condition":"sunny"}
 */

/**
 * Returning structured response3: 
 * {"humour_response":"Wow, looks like the sun is having a nationwide party today! 🌞 Since you're in the USA and it's sunny everywhere, here are some fantastic places to visit:\n\n🗽 **New York City** - Perfect sunny weather for exploring Central Park, Times Square, and the Brooklyn Bridge!\n\n🌴 **Los Angeles** - Sunny skies are calling for Hollywood tours, beach visits in Santa Monica, and hiking in Griffith Park!\n\n🏖️ **Miami** - With this gorgeous sunshine, South Beach and the Art Deco District are absolutely perfect right now!\n\n🌉 **San Francisco** - Even the Golden Gate Bridge is basking in sunshine today - rare and beautiful!\n\n🏙️ **Chicago** - Sunny weather in the Windy City means perfect conditions for Millennium Park and Navy Pier!\n\nAll these cities are blessed with beautiful sunny weather today, so you really can't go wrong with any choice!","time":"Current time","weather_condition":"sunny"}
 */