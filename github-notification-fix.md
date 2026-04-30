# GitHub 알림 수정 내역

## 문제

GitHub 알림이 전부 'push' 이벤트로만 표시되고, 커밋 메시지가 나오지 않음.

---

## 원인 분석

### 1. GitHub Events API가 커밋 정보를 누락

`/repos/{owner}/{repo}/events`에서 PushEvent를 가져올 때 `payload.commits` 배열이 비어 있음.

실제 API 응답:
```json
{
  "type": "PushEvent",
  "payload": {
    "ref": "refs/heads/main",
    "head": "c2dbb067...",
    "before": "e2c4fc2b..."
    // commits 없음
  }
}
```

### 2. Events API는 Notifications API가 아님

`/repos/{repo}/events`는 레포 활동 스트림(push, PR 오픈 등)만 반환.  
PR 리뷰 요청, 멘션, 이슈 댓글 등 실제 알림은 `/notifications` API가 별도로 존재.

---

## 수정 내역

### `src/lib/github.ts`

**이벤트 타입 핸들러 추가** (기존 5종 → 10종)

| 추가된 타입 | 표시 |
|---|---|
| `IssueCommentEvent` | `Issue Comment` |
| `PullRequestReviewEvent` | `PR Review` |
| `PullRequestReviewCommentEvent` | `PR Comment` |
| `WatchEvent` | `Star` |
| `ForkEvent` | `Fork` |

**Notifications API 트랜스포머 추가**

```ts
export function transformGitHubNotifications(notifications): FeedItem[]
```

- `subject.type`(`PullRequest`, `Issue`, `Commit`, `Release`) → 태그/제목 변환
- API URL(`api.github.com/repos/…`) → 브라우저 URL(`github.com/…`) 변환

### `src/app/api/github/route.ts`

**커밋 메시지 보강 (`enrichPushEvents`)**

`payload.commits`가 비어 있는 PushEvent에 대해 HEAD 커밋을 직접 조회:

```
GET /repos/{owner}/{repo}/commits/{head_sha}
→ response.commit.message → payload.commits[0].message 주입
```

최대 10개 병렬 처리, 중복 SHA는 한 번만 조회.

**Notifications API 병렬 페치**

- Events API와 동시에 `/notifications?all=true&since=7일전` 조회
- 레포가 설정된 경우 해당 레포 알림만 필터링
- Events + Notifications 병합 후 시간순 정렬, 30개 표시

---

## 환경 변수 설정

```bash
# .env.local
GITHUB_TOKEN=ghp_xxxx          # notifications 스코프 필요
GITHUB_REPOS=owner/repo1,owner/repo2  # 여러 레포 쉼표 구분
```

토큰 필요 스코프: `repo`, `notifications`
