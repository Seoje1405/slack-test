# Team Dashboard

GitHub, Notion, Discord, Figma 활동을 한 곳에서 모아보는 팀 대시보드입니다. PWA 지원으로 모바일에서도 사용할 수 있습니다.

## 주요 기능

- **통합 피드**: GitHub, Notion, Discord, Figma 이벤트를 시간순으로 표시 — 서비스/날짜/검색 필터 지원
- **서비스별 피드**: 각 서비스별 최신 활동 카드 (즐겨찾기 필터 포함)
- **내 항목 필터**: username 설정 시 내 활동·멘션 항목 강조 및 필터링
- **즐겨찾기**: 피드 항목 별표 저장 (로컬 퍼시스트)
- **뱃지 알림**: 서비스별 마지막 확인 이후 새 항목 카운트
- **통계 대시보드**: Discord 기반 이벤트 빈도 차트 + 기여자 순위
- **GitHub 이슈 생성**: 대시보드에서 레포 선택 후 바로 이슈 생성
- **Notion 페이지 생성**: 마크다운 블록 자동완성으로 빠른 페이지 추가
- **미팅 모드**: Claude AI로 전체 피드를 회의 아젠다로 실시간 요약 (스트리밍)
- **PWA**: 모바일 홈 화면 추가 지원
- **반응형 레이아웃**: 데스크탑(사이드바) / 모바일(하단 탭바)

## 기술 스택

| 항목 | 버전 |
|------|------|
| Next.js | 16.x (App Router) |
| React | 19.x (React Compiler) |
| TypeScript | 5.x (strict) |
| Tailwind CSS | 4.x |
| Zustand | 5.x |
| TanStack Query | 5.x |
| Anthropic SDK | claude-haiku-4-5 |
| Package Manager | pnpm |

## 사전 요구사항

- Node.js 20 이상
- pnpm (`npm install -g pnpm`)
- 아래 서비스들의 API 토큰 (최소 1개 이상)

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```bash
cp .env.local.example .env.local
```

각 서비스 토큰을 입력합니다 (아래 [환경 변수 가이드](#환경-변수-가이드) 참고).

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

### 4. Discord 봇 실행 (선택)

Discord 피드를 사용하는 경우 별도 터미널에서 봇을 실행합니다.

```bash
pnpm bot:dev
```

## 환경 변수 가이드

### 전체 목록

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `GITHUB_TOKEN` | 선택 | GitHub Personal Access Token |
| `GITHUB_REPOS` | 선택 | 모니터링할 저장소 목록 (쉼표 구분, 예: `org/api,org/frontend`) |
| `NOTION_TOKEN` | 선택 | Notion Integration 토큰 |
| `NOTION_DATABASE_ID` | 선택 | 피드 및 페이지 생성에 사용할 DB ID |
| `DISCORD_BOT_TOKEN` | 선택 | Discord 봇 토큰 |
| `DISCORD_GUILD_ID` | 선택 | Discord 서버 ID |
| `FIGMA_TOKEN` | 선택 | Figma Personal Access Token |
| `FIGMA_FILE_KEY` | 선택 | Figma 파일 키 (URL에서 확인) |
| `UPSTASH_REDIS_REST_URL` | 선택 | Upstash Redis URL (Discord 봇 메시지 저장 + 통계용) |
| `UPSTASH_REDIS_REST_TOKEN` | 선택 | Upstash Redis 토큰 |
| `ANTHROPIC_API_KEY` | 선택 | Anthropic API 키 (미팅 AI 요약용) |
| `NEXT_PUBLIC_DISCORD_VOICE_URL` | 선택 | Discord 음성 채널 초대 URL (사이드바에 표시) |
| `NEXT_PUBLIC_CLAUDE_MODEL` | 선택 | Claude 모델 ID 오버라이드 (기본값: `claude-haiku-4-5`) |

### GitHub 토큰 발급

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. **Repository access**: 모니터링할 저장소 선택
3. **Permissions**: `Contents: Read`, `Notifications: Read` 권한 부여
4. `GITHUB_REPOS`는 `owner/repo` 형식으로 쉼표 구분하여 입력
   ```
   GITHUB_REPOS=myorg/api,myorg/frontend
   ```

### Notion 토큰 발급

1. [Notion Integrations](https://www.notion.so/my-integrations) → New integration 생성
2. 발급된 토큰을 `NOTION_TOKEN`에 입력
3. 연결할 Notion 데이터베이스 → 우상단 `...` → Connections → 위에서 만든 Integration 연결
4. 데이터베이스 URL에서 ID 추출 후 `NOTION_DATABASE_ID`에 입력
   ```
   https://notion.so/workspace/[DATABASE_ID]?v=...
   ```

### Discord 봇 설정

Discord 피드는 Gateway 봇이 메시지를 Upstash Redis에 저장하고, 대시보드가 Redis에서 읽는 구조입니다. Vercel과 봇(Railway) 양쪽 모두에 Upstash 환경 변수가 필요합니다.

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. Bot 탭 → Token 복사 → `DISCORD_BOT_TOKEN`에 입력
3. Bot 탭 → Privileged Gateway Intents → **MESSAGE CONTENT INTENT**, **SERVER MEMBERS INTENT** 활성화
4. OAuth2 → URL Generator → `bot` 스코프 → `Read Message History` 권한으로 초대 URL 생성
5. 서버 ID: 서버 우클릭 → Copy Server ID → `DISCORD_GUILD_ID`
6. [Upstash Console](https://console.upstash.com) → Redis 데이터베이스 생성 → REST URL/Token 복사

### Figma 토큰 발급

1. Figma → Account Settings → Personal access tokens → Generate new token
2. 파일 키: Figma URL `figma.com/file/[FILE_KEY]/...` 에서 추출

### Anthropic API 키

1. [Anthropic Console](https://console.anthropic.com) → API Keys → Create Key
2. 발급된 키를 `ANTHROPIC_API_KEY`에 입력

## 개발 명령어

```bash
pnpm dev          # 개발 서버 실행 (Turbopack, HMR)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 실행
pnpm lint         # ESLint 검사
pnpm bot:dev      # Discord 봇 실행 (별도 터미널)
```

> 개발 서버가 실행 중일 때 `pnpm build`를 실행하면 `.next/`가 덮어써져 HMR이 중단됩니다.

## 프로젝트 구조

```
app/
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + Topbar + BottomNav + 사이드 패널 마운트
│   └── dashboard/page.tsx      # 메인 대시보드 (StatGrid + StatsPanel + FeedGrid)
├── api/
│   ├── github/route.ts         # GitHub 이벤트 + 알림 피드
│   ├── github/issues/route.ts  # GitHub 이슈 생성
│   ├── notion/route.ts         # Notion 페이지/DB 피드
│   ├── notion/create/route.ts  # Notion 페이지 생성
│   ├── discord/route.ts        # Discord 메시지 (Upstash Redis)
│   ├── figma/route.ts          # Figma 버전 + 코멘트
│   ├── stats/route.ts          # 이벤트 빈도 + 기여자 통계
│   └── ai/meeting-summary/route.ts  # Claude 미팅 요약 (스트리밍)
├── settings/page.tsx           # 설정 페이지
└── globals.css
components/
├── features/                   # 피드, 통계, 패널 컴포넌트
├── layouts/                    # Sidebar, Topbar, BottomNav
└── ui/                         # shadcn/ui 기반 컴포넌트
hooks/                          # TanStack Query 기반 서비스별 피드 훅
stores/                         # Zustand 전역 상태 (6개 스토어)
lib/                            # 서비스별 데이터 변환 유틸
bot/                            # Discord Gateway 봇 (Railway 별도 배포)
public/
└── sw.js                       # Service Worker (PWA)
```

## 배포 구조

| 서비스 | 역할 |
|--------|------|
| Vercel | Next.js 앱 (API Routes 포함) |
| Railway | Discord Gateway 봇 (상시 실행 필요) |
| Upstash Redis | Discord 메시지 큐 + 통계 데이터 (Vercel ↔ Railway 공유) |
