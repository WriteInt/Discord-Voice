import { EndBehaviorType } from "@discordjs/voice";
import { type Client } from "discord.js";
import { type PlayerMap } from "../../map";
import prism from "prism-media";
import { StreamEncoder as FlacEncoder } from "flac-bindings";
import { transcribeAudio, streamPlayAudio } from "../../ai/openai";
import { createResponse, deleteSession } from "../../ai/anthropic";

export default function attachListener(client: Client, pMap: PlayerMap) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.selfMute !== newState.selfMute && !newState.member?.user.bot) {
            //console.log(`User ${newState.member?.user.username} has ${newState.selfMute ? 'muted' : 'unmuted'} their microphone.`);

            const item = pMap[newState.channelId as string];
            if (!item) return;

            if (!newState.selfMute) {
                if (item.authorId === newState.member?.id) {
                    //console.log("subscribed");
                    item.authorStream = item.connection.receiver.subscribe(newState.member?.id, {
                        end: {
                            behavior: EndBehaviorType.AfterSilence,
                            duration: 300
                        }
                    });

                    const opusStream = item.authorStream.pipe(new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 }) as any);

                    const flacEncoder = new FlacEncoder({
                        channels: 2,
                        sampleRate: 48000,
                        compressionLevel: 5
                    });

                    opusStream.pipe(flacEncoder);

                    let chunks = [];
                    for await (let chunk of flacEncoder) {
                        chunks.push(chunk);
                    }
                    let buffer = Buffer.concat(chunks);

                    const transcription = await transcribeAudio(buffer);
                    const resp = await createResponse(transcription, { id: item.authorId, displayName: item.authorDisplayName, userName: item.authorUserName }, client) as string;
                    if (transcription.length > 2) {
                        if (resp.length < 6) return;
                        await streamPlayAudio(resp, item.player);
                    }
                }
            } else {
                if (item.authorStream) {
                    item.authorStream.pause();
                    item.authorStream.destroy();
                    item.authorStream = undefined;
                    //console.log("Destroyed stream");
                }
            }
        } else if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user!.id)) {
            try {
                const { player, connection } = pMap[oldState.channelId as string];
                if (player) player.stop();
                if (connection) connection.destroy();
                delete pMap[oldState.channelId as string];
                deleteSession({ id: pMap[oldState.channelId as string].authorId });
                newState.disconnect();
            } catch { }
        }
    });
}