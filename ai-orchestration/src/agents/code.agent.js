import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai"
import { listFiles, readFiles, updateFiles } from "./tools.js";
import { createAgent } from "langchain";

const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRALAI_API_KEY,
    temperature: 0.7
})

const agent = createAgent({
    model,
    tools: [listFiles, readFiles, updateFiles]
})

await agent.invoke({
    messages: [
        {
            role: "user",
            content: "Create a playable snake game using react and css, If you want to remove the current you can do that to create the game."
        }
    ]
})