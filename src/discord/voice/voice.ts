import {
    type InternalDiscordGatewayAdapterCreator, GuildMember
} from "discord.js";
import {
    joinVoiceChannel,
    createAudioPlayer,
    entersState,
    VoiceConnectionStatus,
} from "@discordjs/voice";

export async function joinVc(user: GuildMember | null, pMap: any, cb: (err: string) => void) {
    if (!user) return cb("You can only run this cmd in a server!");
    if (!user.voice.channel) return cb("Not in any vc!");

    const connection = joinVoiceChannel({
        channelId: (user.voice.channel as any).id as string,
        guildId: user.guild?.id as string,
        adapterCreator: user.guild?.voiceAdapterCreator as InternalDiscordGatewayAdapterCreator,
        selfDeaf: false,
        selfMute: false
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
        const player = createAudioPlayer();
        connection.subscribe(player);
        const authorId = user.id;
        pMap[(user.voice.channel as any).id] = { player, connection, authorId, authorDisplayName: user.displayName, authorUserName: user.user.username };
    } catch (error) {
        console.error(error);
        cb("Failed to join vc!")
        connection.destroy();
    }
}