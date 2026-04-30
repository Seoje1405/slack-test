<!-- BEGIN:nextjs-agent-rules -->
# Next.js: ALWAYS read docs before coding
Before any Next.js work, find and read the relevant doc in
`node_modules/next/dist/docs/`.
Your training data is outdated — the docs are the source of truth.
<!-- END:nextjs-agent-rules -->

---

# Project rules — Next.js 16 + React 19

## Stack

- **Framework**: Next.js 16.x (App Router only — never use Pages Router patterns)
- **React**: 19.x (React Compiler enabled)
- **Language**: TypeScript strict mode
- **Bundler**: Turbopack (default, no webpack config needed)
- **Package manager**: pnpm

---

## Architecture rules

### Server vs Client components

- Default to **Server Components** for all new components.
- Add `'use client'` only when the component needs: browser APIs, event listeners,
  `useState`, `useEffect`, or third-party client-only libraries.
- Never add `'use client'` just to use `async/await` — Server Components support it natively.

```tsx
// CORRECT — Server Component (default, no directive needed)
export default async function ProductList() {
  const products = await db.products.findMany()
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}

// CORRECT — Client Component (only when necessary)
'use client'
export function LikeButton({ id }: { id: string }) {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(l => !l)}>{liked ? '♥' : '♡'}</button>
}
```

### Routing

- Use `app/` directory for all routes (no `pages/`).
- File conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Dynamic segments: `[id]`, catch-all: `[...slug]`, optional: `[[...slug]]`.
- Route groups: `(group)/` — does not affect URL.
- Params are now **async** in Next.js 16 — always `await params`.

```tsx
// CORRECT — async params (Next.js 16)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>{id}</div>
}
```

### Request interception (proxy.ts)

- Use `proxy.ts` for request interception — `middleware.ts` is **deprecated**.
- `proxy.ts` runs on Node.js runtime only. No Edge runtime.
- Rename exported function from `middleware` to `proxy`.

```ts
// app/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
  if (isProtected && !request.cookies.get('access_token')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Caching rules

Next.js 16 uses **explicit opt-in** caching (`'use cache'`). Nothing is cached by default.

### When to use `'use cache'`

- Static or semi-static data (product lists, blog posts, navigation).
- Database reads that don't depend on per-request values.
- Expensive computations.

```ts
// Page-level cache
'use cache'
import { cacheLife, cacheTag } from 'next/cache'

export default async function ProductsPage() {
  cacheLife({ revalidate: 3600 })  // 1-hour cache
  cacheTag('products')              // tag for targeted invalidation
  const products = await db.products.findMany()
  return <ProductList products={products} />
}

// Function-level cache
'use cache'
async function getUser(id: string) {
  cacheLife({ revalidate: 300 })
  cacheTag(`user-${id}`)
  return db.users.findUnique({ where: { id } })
}
```

### Cache invalidation

```ts
// Server Action — invalidate by tag after mutation
'use server'
import { revalidateTag } from 'next/cache'

export async function updateProduct(id: string, data: FormData) {
  await db.products.update({ where: { id }, data: parse(data) })
  revalidateTag('products')
  revalidateTag(`product-${id}`)
}
```

### When NOT to cache

- User-specific data (cart, notifications, profile).
- Real-time data (live prices, availability).
- Anything that reads request headers, cookies, or search params without wrapping.

---

## Data fetching rules

### Eliminate waterfalls — highest impact rule

```ts
// BAD — sequential awaits (each adds full network round-trip)
const user = await getUser(id)
const posts = await getPosts(user.id)
const comments = await getComments(posts[0].id)

// GOOD — parallel when independent
const [user, config] = await Promise.all([getUser(id), getConfig()])

// GOOD — when partially dependent, start early
const userPromise = getUser(id)
const configPromise = getConfig()
const user = await userPromise
const posts = await getPosts(user.id)
const config = await configPromise
```

### Check cheap conditions before awaiting

```ts
// BAD — always awaits even when guard will fail
async function getAdminData(userId: string, isAdmin: boolean) {
  const data = await fetchAdminResource()
  if (!isAdmin) throw new Error('Unauthorized')
  return data
}

// GOOD — guard first, await only if needed
async function getAdminData(userId: string, isAdmin: boolean) {
  if (!isAdmin) throw new Error('Unauthorized')
  return fetchAdminResource()
}
```

### Use Suspense for streaming

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<Skeleton />}>
        <DynamicFeed />   {/* streams in after static shell */}
      </Suspense>
    </div>
  )
}
```

### Non-blocking side effects with `after()`

```ts
import { after } from 'next/server'

export async function POST(request: Request) {
  await updateDatabase(request)

  // Runs AFTER response is sent — does not block user
  after(async () => {
    await logAnalytics({ path: request.url })
  })

  return Response.json({ status: 'ok' })
}
```

---

## Server Actions

- Always validate input with **Zod**.
- Always verify authentication before any mutation.
- Always call `revalidateTag` or `revalidatePath` after mutations.
- Never trust client-sent IDs without ownership verification.

```ts
'use server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

const schema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(10),
})

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = schema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  if (!parsed.success) return { error: parsed.error.flatten() }

  await db.post.create({ data: { ...parsed.data, authorId: session.user.id } })
  revalidateTag('posts')
}
```

---

## React 19 rules

### React Compiler — no manual memoization

React Compiler (stable in Next.js 16) handles memoization automatically.
Do not add `useMemo`, `useCallback`, or `memo()` unless there is a measurable regression.

```tsx
// BAD — unnecessary manual memoization
const filtered = useMemo(() => items.filter(active), [items, active])
const handler = useCallback(() => onClick(id), [id, onClick])

// GOOD — write plain code, compiler optimizes
const filtered = items.filter(active)
const handler = () => onClick(id)
```

### `useEffectEvent` — non-reactive logic in Effects

```tsx
import { useEffectEvent } from 'react'

function Chat({ roomId, onMessage }: Props) {
  // onMessage is non-reactive — excluded from deps
  const handleMessage = useEffectEvent(onMessage)

  useEffect(() => {
    const socket = connect(roomId)
    socket.on('message', handleMessage)  // stable reference, no stale closure
    return () => socket.disconnect()
  }, [roomId])  // only roomId as dep — correct
}
```

**CRITICAL**: Never include `useEffectEvent` return value in dependency arrays.

### `<Activity>` — background state preservation

```tsx
import { Activity } from 'react'

// UI hidden but state preserved — no re-mount on show
<Activity mode={isActive ? 'visible' : 'hidden'}>
  <ExpensivePanel />
</Activity>
```

### View Transitions — navigation animations

```tsx
// app/layout.tsx
import { ViewTransitions } from 'next/view-transitions'

export default function Layout({ children }) {
  return <html><body><ViewTransitions />{children}</body></html>
}

// Usage in Link
<Link href="/product/123" transitionTypes={['slide-left']}>View</Link>
```

---

## Bundle size rules

### No barrel file imports

```ts
// BAD — imports entire library
import { Button, Input, Modal } from '@/components'
import { format } from 'date-fns'

// GOOD — direct import only what's needed
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { format } from 'date-fns/format'
```

Libraries commonly affected: `lucide-react`, `@mui/material`, `@mui/icons-material`,
`react-icons`, `lodash`, `date-fns`, `@radix-ui/react-*`.

### Dynamic imports for heavy components

```tsx
import dynamic from 'next/dynamic'

// Only loads when rendered — not in initial bundle
const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,  // for browser-only libraries
})

// Conditional feature loading
const DevTools = dynamic(() => import('./DevTools'))
{process.env.NODE_ENV === 'development' && <DevTools />}
```

### Defer third-party scripts

```tsx
// Load analytics after hydration — never blocks interactive
import Script from 'next/script'

<Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />
```

---

## Re-render optimization

### Derive state during render — no `useEffect` for derivation

```tsx
// BAD — useEffect for computed value
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])

// GOOD — compute inline during render
const fullName = `${firstName} ${lastName}`
```

### `startTransition` for non-urgent updates

```tsx
import { useTransition } from 'react'

function SearchInput() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState([])
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    setInput(value)  // urgent — update input immediately
    startTransition(() => {
      setResults(filterData(value))  // non-urgent — can be deferred
    })
  }
}
```

### No inline component definitions

```tsx
// BAD — new component reference on every render = full remount
function Parent() {
  const Item = ({ text }: { text: string }) => <li>{text}</li>  // never do this
  return <ul>{items.map(i => <Item key={i.id} text={i.name} />)}</ul>
}

// GOOD — define at module level
function Item({ text }: { text: string }) {
  return <li>{text}</li>
}
function Parent() {
  return <ul>{items.map(i => <Item key={i.id} text={i.name} />)}</ul>
}
```

---

## TypeScript rules

- `strict: true` in `tsconfig.json` — no exceptions.
- Never use `any`. Use `unknown` for genuinely unknown values and narrow with type guards.
- Use `satisfies` operator for config objects (preserves literal types).
- Route params and search params are typed via `next/navigation`.

```ts
// Config with satisfies — preserves literals + validates shape
const config = {
  theme: 'dark',
  locale: 'ko',
} satisfies AppConfig

// Unknown input — always narrow
function handle(input: unknown) {
  if (typeof input === 'string') return input.toUpperCase()
  throw new TypeError('Expected string')
}
```

---

## Forms

Use **React Hook Form** + **Zod** for all forms.

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '8자 이상 입력하세요'),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = handleSubmit(async (data) => {
    await loginAction(data)
  })

  return (
    <form onSubmit={onSubmit}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      <input type="password" {...register('password')} />
      {errors.password && <p>{errors.password.message}</p>}
      <button type="submit">로그인</button>
    </form>
  )
}
```

---

## State management

| State type | Tool | Notes |
|-----------|------|-------|
| Server state (cache) | TanStack Query v5 | `staleTime`, `queryKey` 필수 |
| Client global state | Zustand | slice 패턴 권장 |
| Form state | React Hook Form | Zod resolver 사용 |
| URL state | `nuqs` | search params ↔ state sync |
| Local component state | `useState` / `useReducer` | 최우선 고려 |

---

## Performance — Core Web Vitals

- **Images**: always use `next/image`. Set explicit `width`/`height` or `fill`. Use `priority` for LCP images.
- **Fonts**: use `next/font/google` with `display: 'swap'`.
- **Lazy load**: `dynamic()` for heavy components, `loading="lazy"` for below-fold images.
- **Measure first**: use Chrome DevTools > Performance or Vercel Analytics before optimizing.

```tsx
import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

// LCP image — add priority
<Image src="/hero.jpg" width={1200} height={600} priority alt="Hero" />
```

---

## Development commands

```bash
pnpm dev          # dev server with HMR (Turbopack)
pnpm build        # production build
pnpm start        # production server
pnpm type-check   # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest
pnpm test:e2e     # playwright
```

**Do NOT** run `pnpm build` during an active dev session — it overwrites `.next/` and breaks HMR.

---

## Environment variables

- Server-only secrets: `DATABASE_URL`, `JWT_SECRET`, etc. — never use `NEXT_PUBLIC_` prefix.
- Client-accessible vars: `NEXT_PUBLIC_API_URL` — safe to expose.
- Never print or log secret values. Use `***` in logs when referencing secrets.
- Use `t3-env` or `zod` to validate env vars at startup.

```ts
// env.ts — validated at build time
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
})

export const env = schema.parse(process.env)
```

---

## Security checklist

- [ ] All Server Actions verify authentication before mutation
- [ ] All user inputs validated with Zod before DB write
- [ ] `proxy.ts` guards all protected routes
- [ ] Refresh Token: `HttpOnly; Secure; SameSite=Strict` cookie
- [ ] Access Token: memory only (never `localStorage`)
- [ ] `NEXT_PUBLIC_` vars contain no secrets
- [ ] `revalidateTag` called after every mutation
- [ ] Rate limiting on auth endpoints

---

## File structure (reference)

```
app/
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + Topbar + BottomNav + side panels
│   └── dashboard/page.tsx
├── api/
│   ├── github/route.ts         # GET — Events + Notifications (enrichPushEvents)
│   ├── github/issues/route.ts  # POST — create GitHub issue
│   ├── notion/route.ts         # GET — Notion DB feed
│   ├── notion/create/route.ts  # POST — create Notion page
│   ├── discord/route.ts        # GET — Discord messages from Upstash Redis
│   ├── figma/route.ts          # GET — Figma versions + comments
│   ├── stats/route.ts          # GET — task frequency + top contributors from Redis
│   └── ai/meeting-summary/route.ts  # POST — Claude streaming meeting agenda
├── manifest.ts                 # PWA Web App Manifest
├── layout.tsx                  # root layout (viewport, PWA meta, SW script)
└── globals.css                 # CSS vars, --bottom-nav-h, .pb-safe-nav, .h-bottom-nav
components/
├── features/
│   ├── FeedGrid.tsx            # grid of FeedPanel cards (grid / unified toggle)
│   ├── FeedPanel.tsx           # single service feed card with pagination + fav filter
│   ├── FeedItem.tsx            # single feed entry — avatar, title, tag, isMine highlight
│   ├── StatGrid.tsx            # 4-up stat cards (one per service)
│   ├── StatCard.tsx            # service color + count + status badge
│   ├── StatsPanel.tsx          # task frequency bar + top contributors leaderboard
│   ├── UnifiedFeedPanel.tsx    # unified chronological feed — service/date/search/myItems filter
│   ├── MeetingPanel.tsx        # right panel — meeting mode + Claude AI streaming summary
│   ├── NotionAddPanel.tsx      # right panel — Notion quick page create with block suggestions
│   ├── NotionQuickAdd.tsx      # inline minimal Notion add form (bottom of Notion panel)
│   ├── GitHubIssuePanel.tsx    # right panel — GitHub issue creation with repo selector
│   └── SettingsForm.tsx        # settings page form — profile, repos, Notion mode, env guide
├── layouts/
│   ├── Sidebar.tsx      # desktop always-visible; mobile overlay drawer
│   ├── Topbar.tsx       # refresh button + mobile hamburger
│   └── BottomNav.tsx    # md:hidden fixed bottom tab bar (mobile only)
└── ui/                  # shadcn/ui base components
hooks/                   # custom hooks ('use client')
├── useGitHubFeed.ts          # staleTime 55s, refetchInterval 60s
├── useNotionFeed.ts          # staleTime 115s, refetchInterval 120s
├── useDiscordFeed.ts         # staleTime 25s, refetchInterval 30s
├── useFigmaFeed.ts           # staleTime 115s, refetchInterval 300s
├── useServiceBadgeCounts.ts  # unread badge counts per service
└── useHasHydrated.ts         # SSR hydration guard
stores/
├── dashboardStore.ts         # activeFilter, viewMode, myItemsFilter, meetingMode,
│                             #   notionAddMode, githubIssueMode, sidebarOpen
├── feedAnnotationStore.ts    # favorites: Record<id, bool> (persisted)
├── githubSettingsStore.ts    # repos: string[] (persisted)
├── notionSettingsStore.ts    # mode: 'search'|'database', databaseId (persisted)
├── notificationStore.ts      # lastSeen per service for badge counts (persisted)
└── userProfileStore.ts       # myUsername (persisted) + matchesMyUsername()
lib/
├── github.ts            # transform helpers, enrichPushEvents, GitHubNotification type
├── notion.ts            # page title extraction, block builders
├── discord.ts           # message normalization, avatar URL builder
├── figma.ts             # version + comment transform, deduplication
├── stats.ts             # Redis stats parsing helpers
└── utils.ts             # cn(), timeAgo()
types/
└── feed.ts              # ServiceId, ServiceStatus, FeedItem, StatsData
public/
├── sw.js                # Service Worker (cache-first static, network-first nav)
└── icons/icon.svg
config/
└── services.ts          # SERVICES array — id, label, color, pollingInterval per service
```

---

## Mobile / PWA patterns

- Use `h-[100dvh]` instead of `h-screen` — prevents layout jump on mobile browsers with dynamic toolbars.
- Apply `pb-safe-nav` to scrollable main content — adds `env(safe-area-inset-bottom)` + `--bottom-nav-h` padding for iOS notch/home bar.
- `BottomNav` is `md:hidden` — never show it on desktop.
- `Sidebar` is `hidden md:flex` on desktop; on mobile it renders as a fixed overlay drawer triggered by `sidebarOpen` in `dashboardStore`.
- `Topbar` hamburger button is `md:hidden` — calls `toggleSidebar`.

---

## Side panel pattern (MeetingPanel / NotionAddPanel / GitHubIssuePanel)

All three panels share the same interaction model — follow it for any new panel:

- Fixed right-side panel: `fixed top-0 right-0 h-full w-[N]px z-40 border-l flex flex-col`
- Activated via a boolean in `dashboardStore` (e.g. `meetingMode`, `notionAddMode`, `githubIssueMode`)
- **Mutually exclusive**: opening one closes the other (enforced in `dashboardStore` toggle actions)
- Toggled from the left `Sidebar` — button highlights when panel is open
- On mobile, these panels overlay the content at full width — consider `w-full md:w-[N]px` for new panels

---

## Environment variables (project-specific)

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Personal access token (fine-grained, `notifications:read` + `contents:read`) |
| `GITHUB_REPOS` | Comma-separated `owner/repo` list — e.g. `org/api,org/frontend` |
| `NOTION_TOKEN` | Notion Integration token |
| `NOTION_DATABASE_ID` | Default database for feed + page creation |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `DISCORD_GUILD_ID` | Target Discord server ID |
| `FIGMA_TOKEN` | Figma personal access token |
| `FIGMA_FILE_KEY` | Figma file key (from URL) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL — Discord bot writes messages here; frontend reads |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (required alongside URL) |
| `ANTHROPIC_API_KEY` | Claude API key for AI meeting summary (streaming) |
| `NEXT_PUBLIC_DISCORD_VOICE_URL` | Discord voice channel invite URL (optional, shows in Sidebar) |
| `NEXT_PUBLIC_CLAUDE_MODEL` | Override Claude model ID (optional, defaults to `claude-haiku-4-5`) |

---

## Deprecated — never use in this project

| Deprecated | Use instead |
|-----------|-------------|
| `middleware.ts` | `proxy.ts` |
| `getServerSideProps` | Server Component + `fetch` |
| `getStaticProps` | `'use cache'` directive |
| `pages/` directory | `app/` directory |
| Manual `useMemo`/`useCallback` | React Compiler (automatic) |
| `localStorage` for tokens | Memory (Access) + HttpOnly Cookie (Refresh) |
| `process.env.NODE_ENV` checks in components | `next/headers` or Server Actions |
