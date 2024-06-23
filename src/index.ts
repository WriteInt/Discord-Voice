import { Client, GatewayIntentBits, Message } from "discord.js";
import { streamPlayAudio } from "./ai/openai";
import { joinVc } from "./discord/voice/voice";
import attachListener from "./discord/voice/state";
import pMap from "./map";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

client.on("ready", () => {
  console.log("Ready!");
});

attachListener(client, pMap);

client.on("messageCreate", async (msg: Message) => {
  if (msg.content.startsWith("!start")) {
    if (!pMap[msg.member?.voice.channel?.id as string]) await joinVc(msg.member, pMap, (err) => msg.reply(err));
    try {
      const { player } = pMap[msg.member?.voice.channel?.id as string];
      if (player) {
        await streamPlayAudio("Ahoy! I'm ready to answer your questions capt'", player);
      }
    } catch (err) { console.error(err); }
  }
});


client.login(Bun.env.DISCORD_BOT_TOKEN); 