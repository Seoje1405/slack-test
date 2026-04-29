import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  TextChannel,
} from 'discord.js';
import { appendEvent, incrementTaskStat, incrementContributorStat } from './store.js';

// 환경변수 상태 출력 (값은 노출하지 않음)
console.log('[Bot] 환경변수 체크:');
console.log(`  DISCORD_BOT_TOKEN       : ${process.env.DISCORD_BOT_TOKEN       ? '✓' : '✗ 없음'}`);
console.log(`  UPSTASH_REDIS_REST_URL  : ${process.env.UPSTASH_REDIS_REST_URL  ? '✓' : '✗ 없음'}`);
console.log(`  UPSTASH_REDIS_REST_TOKEN: ${process.env.UPSTASH_REDIS_REST_TOKEN ? '✓' : '✗ 없음'}`);
console.log(`  DISCORD_GUILD_ID        : ${process.env.DISCORD_GUILD_ID        ? '✓' : '(미설정 — 전체 서버 수신)'}`);

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) {
  console.error('[Bot] 종료: DISCORD_BOT_TOKEN 없음');
  process.exit(1);
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('[Bot] 종료: UPSTASH_REDIS_REST_URL 또는 UPSTASH_REDIS_REST_TOKEN 없음');
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
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!isTargetGuild(message.guildId)) return;

  const hasMention = message.mentions.users.size > 0 || message.mentions.roles.size > 0;
  const channelName = message.channel instanceof TextChannel ? message.channel.name : 'DM';
  const content = message.content.slice(0, 120) + (message.content.length > 120 ? '…' : '');

  const eventType = hasMention ? 'mention' : 'message';
  await appendEvent({
    id: message.id,
    type: eventType,
    title: content || '(첨부파일 또는 임베드)',
    user: message.author.username,
    avatarUrl: message.author.avatarURL() ?? null,
    time: message.createdAt.toISOString(),
    tag: `#${channelName}`,
    url: message.url,
  }).catch(console.error);
  incrementTaskStat(eventType).catch(console.error);
  incrementContributorStat(message.author.username).catch(console.error);
});

// 음성 채널 입/퇴장/이동
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const user = newState.member?.user ?? oldState.member?.user;
  if (!user || user.bot) return;
  if (!isTargetGuild(newState.guild?.id ?? oldState.guild?.id)) return;

  const joined = !oldState.channelId && !!newState.channelId;
  const left = !!oldState.channelId && !newState.channelId;
  const moved = !!oldState.channelId && !!newState.channelId && oldState.channelId !== newState.channelId;

  if (!joined && !left && !moved) return;

  const channelName = (newState.channel ?? oldState.channel)?.name ?? '알 수 없음';
  const type = joined ? 'voice_join' : moved ? 'voice_move' : 'voice_leave';
  const title = joined
    ? `${user.username}님이 ${channelName}에 입장`
    : moved
    ? `${user.username}님이 ${newState.channel?.name}으로 이동`
    : `${user.username}님이 ${channelName}에서 퇴장`;

  await appendEvent({
    id: `voice-${user.id}-${Date.now()}`,
    type,
    title,
    user: user.username,
    avatarUrl: user.avatarURL() ?? null,
    time: new Date().toISOString(),
    tag: channelName,
    url: null,
  }).catch(console.error);
  incrementTaskStat(type).catch(console.error);
  incrementContributorStat(user.username).catch(console.error);
});

// 멤버 입장
client.on(Events.GuildMemberAdd, async (member) => {
  if (!isTargetGuild(member.guild.id)) return;

  await appendEvent({
    id: `join-${member.id}-${Date.now()}`,
    type: 'member_join',
    title: `${member.user.username}님이 서버에 참가`,
    user: member.user.username,
    avatarUrl: member.user.avatarURL() ?? null,
    time: new Date().toISOString(),
    tag: '서버 참가',
    url: null,
  }).catch(console.error);
  incrementTaskStat('member_join').catch(console.error);
  incrementContributorStat(member.user.username).catch(console.error);
});

// 멤버 퇴장
client.on(Events.GuildMemberRemove, async (member) => {
  if (!isTargetGuild(member.guild.id)) return;

  await appendEvent({
    id: `leave-${member.id}-${Date.now()}`,
    type: 'member_leave',
    title: `${member.user.username}님이 서버에서 퇴장`,
    user: member.user.username,
    avatarUrl: member.user.avatarURL() ?? null,
    time: new Date().toISOString(),
    tag: '서버 퇴장',
    url: null,
  }).catch(console.error);
  incrementTaskStat('member_leave').catch(console.error);
  incrementContributorStat(member.user.username).catch(console.error);
});

client.login(token);
