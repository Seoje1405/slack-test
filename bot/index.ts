import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  TextChannel,
} from 'discord.js';
import { appendEvent } from './store.js';

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID; // 특정 서버로 제한 (선택)

if (!token) {
  console.error('[Bot] DISCORD_BOT_TOKEN이 설정되지 않았습니다.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

function isTargetGuild(id: string | null | undefined): boolean {
  if (!guildId) return true;
  return id === guildId;
}

client.once(Events.ClientReady, (c) => {
  console.log(`[Bot] 준비 완료: ${c.user.tag}`);
  if (guildId) console.log(`[Bot] 서버 필터: ${guildId}`);
});

// 메시지 (멘션 포함)
client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (!isTargetGuild(message.guildId)) return;

  const hasMention = message.mentions.users.size > 0 || message.mentions.roles.size > 0;
  const channelName = message.channel instanceof TextChannel ? message.channel.name : 'DM';
  const content = message.content.slice(0, 120) + (message.content.length > 120 ? '…' : '');

  appendEvent({
    id: message.id,
    type: hasMention ? 'mention' : 'message',
    title: content || '(첨부파일 또는 임베드)',
    user: message.author.username,
    avatarUrl: message.author.avatarURL() ?? null,
    time: message.createdAt.toISOString(),
    tag: `#${channelName}`,
    url: message.url,
  });
});

// 음성 채널 입/퇴장
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const user = newState.member?.user ?? oldState.member?.user;
  if (!user || user.bot) return;
  if (!isTargetGuild(newState.guild?.id ?? oldState.guild?.id)) return;

  const joined = !oldState.channelId && !!newState.channelId;
  const left = !!oldState.channelId && !newState.channelId;
  const moved =
    !!oldState.channelId &&
    !!newState.channelId &&
    oldState.channelId !== newState.channelId;

  if (!joined && !left && !moved) return;

  const channelName = (newState.channel ?? oldState.channel)?.name ?? '알 수 없음';
  const type = joined ? 'voice_join' : moved ? 'voice_move' : 'voice_leave';
  const title = joined
    ? `${user.username}님이 ${channelName}에 입장`
    : moved
    ? `${user.username}님이 ${newState.channel?.name}으로 이동`
    : `${user.username}님이 ${channelName}에서 퇴장`;

  appendEvent({
    id: `voice-${user.id}-${Date.now()}`,
    type,
    title,
    user: user.username,
    avatarUrl: user.avatarURL() ?? null,
    time: new Date().toISOString(),
    tag: channelName,
    url: null,
  });
});

// 멤버 입장
client.on(Events.GuildMemberAdd, (member) => {
  if (!isTargetGuild(member.guild.id)) return;

  appendEvent({
    id: `join-${member.id}-${Date.now()}`,
    type: 'member_join',
    title: `${member.user.username}님이 서버에 참가`,
    user: member.user.username,
    avatarUrl: member.user.avatarURL() ?? null,
    time: new Date().toISOString(),
    tag: '서버 참가',
    url: null,
  });
});

// 멤버 퇴장
client.on(Events.GuildMemberRemove, (member) => {
  if (!isTargetGuild(member.guild.id)) return;

  appendEvent({
    id: `leave-${member.id}-${Date.now()}`,
    type: 'member_leave',
    title: `${member.user.username}님이 서버에서 퇴장`,
    user: member.user.username,
    avatarUrl: member.user.avatarURL() ?? null,
    time: new Date().toISOString(),
    tag: '서버 퇴장',
    url: null,
  });
});

client.login(token);
