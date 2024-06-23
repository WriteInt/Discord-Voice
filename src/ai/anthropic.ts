// I decided to use anthropic because claude 3.5 sonnet model
// understands the prompt better than gpt4-o
// plus its nice to have! :)

import Anthropic from "@anthropic-ai/sdk";
import { generateImageTool } from "./openai";
import { channelLink, type Client } from "discord.js";

const a = new Anthropic({ apiKey: Bun.env.ANTHROPIC_API_KEY });

const usersMap = new Map<string, { role: "user" | "assistant"; content: string; }[]>();

export async function createResponse(content: string, user: any, client: any) {
    console.log(content);
    const history = usersMap.get(user.id) || [];
    const res = await a.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1046,
        tools: [
            {
                name: "generate_image", description: "generate an image with dalle-3", input_schema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "a very descriptive prompt about the image to generate. it should be descriptive enough that you explain how it looks instead of phrasing it like for instance prompt would be: \"pikachu: a yellow electric mouse pokemon (this could be even more descriptive)\""
                        }
                    }
                }
            }
        ],
        messages: [
            { role: "user", content: `You're Onyx. An AI voice assistant on discord and this is a system prompt. You can help answer my questions and queries. You will give explanations if required but you shouldn't provide code since you're voice based. You are talking to displayName: ${user.displayName} currently and his discord username is ${user.discord}. (Note: If the user isn't a native speaker the text would be transcribed in a weird way. respond that you didn't understand when it happens.). It's also nice to try understanding if there are any mistakes in the sentence because mostly its due to wrong transcription. The conversation should be very natural and shouldn't be lengthy. Plus you don't have to remind the user that you're an AI assistant. keep your responses as short as possible! goodluck!` },
            { role: "assistant", content: `Perfect! gotcha! ${user.displayName}!` },
            ...history,
            { role: "user", content }
        ]
    });

    const c = (res.content[0] as any).text as string;

    // I'm sure it is currently advanced enough for multiple tool uses in a single call.
    // but to keep things simple I'm gonna leave this like this.
    if (res.content[1] && res.content[1].type == "tool_use") {
        handleToolUse(res.content[1].name, client, res.content[1].input);
    }

    history.push({ role: "user", content });
    history.push({ role: "assistant", content: c });

    while (history.length > 10 && history[0].role == "user") history.shift();

    return c;
}

export function deleteSession(user: any) {
    usersMap.delete(user.id);
}

async function handleToolUse(name: string, client: Client, input: any) {
    if (name == "generate_image") {
        const channel = client.channels.cache.get(Bun.env.DISCORD_DALLE3_CHANNEL_ID as string);
        if (channel?.isTextBased()) {
            channel.sendTyping();
            const embed = await generateImageTool(input.prompt);
            channel.send({ embeds: [embed] });
        }
    }
}