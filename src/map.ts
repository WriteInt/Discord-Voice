import { AudioPlayer, AudioReceiveStream, VoiceConnection } from "@discordjs/voice";
import { opus } from "prism-media";

export interface PlayerMap {
    [key: string]: {
        player: AudioPlayer;
        connection: VoiceConnection;
        authorId: string;
        authorDisplayName: string;
        authorUserName: string;
        authorStream?: AudioReceiveStream;
        outputStream?: NodeJS.WritableStream;
    };
}

const pMap: PlayerMap = {};

export default pMap;