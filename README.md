# RepoSignal

Interactive GitHub contribution dashboard for scanning a repository, creating a workspace, onboarding the scan, and sharing a read-only analytics board.

## Routes

- `/repository` validates a GitHub repository URL or `owner/repo`.
- `/workspace/new` creates scan settings for the workspace.
- `/workspace/[workspaceId]/onboarding` runs the onboarding flow and scan.
- `/workspace/[workspaceId]/dashboard` shows the live workspace dashboard.
- `/share/[shareId]` shows a public read-only dashboard using encoded scan settings.

## Credentials

Copy `.env.example` to `.env.local` and fill what you need.

```bash
GITHUB_TOKEN=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_SCAN_MAX_PAGES=2
GITHUB_SCAN_CONCURRENCY=4
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Public repositories can scan without `GITHUB_TOKEN`, but GitHub's anonymous rate limit is low. Add a token for private repositories, larger scans, and more accurate PR/commit detail.

Recommended GitHub permissions:

- `Contents: read`
- `Pull requests: read`
- `Metadata: read`
- `Webhooks: write` only if you want automatic webhook registration later

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Notes

The current implementation performs live GitHub REST scans through server route handlers, computes contributor scoring, and generates shareable URLs without exposing credentials to the browser. The webhook endpoint at `/api/webhooks/github` verifies GitHub signatures and is ready for a production queue or database-backed incremental refresh.
