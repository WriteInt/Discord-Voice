import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { Readable } from "stream";
import { createAudioResource } from "@discordjs/voice";
import { type AudioPlayer } from "@discordjs/voice";
import { EmbedBuilder } from "discord.js";

const openai = new OpenAI({ apiKey: Bun.env.OPENAI_API_KEY });

export async function streamPlayAudio(input: string, player: AudioPlayer): Promise<void> {
    const res = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input,
        response_format: "opus",
        speed: 1
    });

    if (!res.body) throw new Error("No response body");

    const nodeStream = new Readable({
        read() { }
    });

    const reader = res.body.getReader();
    const recurse = async () => {
        const { done, value } = await reader.read();
        done ? nodeStream.push(null) : (nodeStream.push(Buffer.from(value)), recurse());
    };

    recurse().catch((err) => nodeStream.destroy(err));

    const resource = createAudioResource(nodeStream);
    player.play(resource);
}

export async function transcribeAudio(buf: any) {
    const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        response_format: "text",
        file: await toFile(buf, "chunk.flac")
    });
    return (transcription as unknown as string).trim();
}

export async function generateImageTool(prompt: string) {
    const res = await openai.images.generate({
        prompt: prompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024"
    });

    const embed = new EmbedBuilder().setDescription("generated image:").setImage(res.data[0].url as string);
    return embed;
}