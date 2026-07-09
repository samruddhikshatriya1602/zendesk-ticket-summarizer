# Zendesk Ticket Summarizer

An agent workspace that connects to Zendesk, displays tickets in a split-panel UI, and uses AI to help agents prioritize work — with **per-ticket summaries** and a **queue-level “Summary of your work”** insight below search.

Built as a full-stack TypeScript exercise: Express backend (API proxy + AI orchestration) and React frontend (Zendesk Garden UI).

---

## Features

### Ticket workspace
- **60/40 split layout** — ticket list (left) and ticket detail + AI summary (right)
- **Paginated ticket list** from Zendesk (30 tickets per page)
- **Search** by subject or ticket ID — instant filter on the current page (1 character); account-wide Zendesk Search API when you type 2+ characters (300ms debounce)
- **Column filters** — Status, Priority, Updated sort (table header dropdowns)
- **Keyboard shortcuts** — `/` search, `↑` `↓` navigate, `Enter` open ticket, `?` help, `Esc` back
- **Resizable panels** — drag the center divider

### Per-ticket AI summary (right panel)
- **Generate Summary** — AI reads ticket description + comment thread
- **Refresh summary** — bypass cache and regenerate from latest data
- **Copy to clipboard** — formatted summary text
- **In-memory cache** — avoids repeat AI calls for unchanged tickets (optional TTL)

### Queue work insights (below search)
- **“Summary of your work”** — AI analyzes open/pending tickets across your queue
- **One-sentence overview** + **priority theme rows** with count badges and Garden priority tags
- **Accent card UI** — left border color reflects highest priority theme (urgent → high → normal)
- Loads automatically once the ticket list is ready (no manual refresh button)
- **Does not refetch** when you search or filter — it describes the whole active queue, not the filtered view

### Backend
- Zendesk REST API integration (list, detail, comments, bulk snapshots)
- Zendesk AI Gateway integration with **two paths**:
  - **OpenAI-compatible** (`/v1/chat/completions`) for per-ticket summaries
  - **Bedrock** (`/bedrock/model/.../invoke`) for queue work insights (Claude)
- Structured JSON validation for all AI responses
- **67 backend tests** + **10 frontend tests**

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│  React frontend (localhost:5173)                                │
│  ┌──────────────────────┬──────────────────────────────────────┐│
│  │ Ticket list          │ Ticket detail                        ││
│  │ • Search             │ • Hero, description, comments        ││
│  │ • Work insights card │ • AI summary (generate/refresh/copy) ││
│  │ • Table + pagination │                                      ││
│  └──────────────────────┴──────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (CORS)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Express backend (localhost:3001)                               │
│  • GET  /api/tickets                                            │
│  • GET  /api/tickets/:id                                        │
│  • POST /api/tickets/:id/summary                                │
│  • GET  /api/work-insights                                      │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             ▼                               ▼
    ┌────────────────┐            ┌─────────────────────────────┐
    │ Zendesk API    │            │ Zendesk AI Gateway          │
    │ (REST)         │            │ • GPT (ticket summaries)    │
    └────────────────┘            │ • Claude/Bedrock (insights) │
                                  └─────────────────────────────┘
```

### Work insights pipeline

```text
Fetch up to 500 tickets from Zendesk (subject, status, priority only)
        ↓
Keep open + pending only
        ↓
Sort by priority (urgent → high → normal → low), then status
        ↓
Cap at 300 tickets for AI prompt
        ↓
Claude via Bedrock → JSON themes + summary sentence
        ↓
Work insights card in UI
```

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, TypeScript, Vite, React Router, Zendesk Garden, styled-components |
| **Backend** | Node.js, Express 5, TypeScript, Jest, Supertest |
| **External** | Zendesk REST API, Zendesk AI Gateway (OpenAI + Bedrock) |

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm**
- **Zendesk training/sandbox account** with API access
- **Zendesk AI Gateway token** — create at [https://ai-gateway.zende.sk/tokens/create](https://ai-gateway.zende.sk/tokens/create)

---

## Quick start

### 1. Clone and install

```bash
cd zendesk_ticket_summarizer

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials (see [Environment variables](#environment-variables) below).

### 3. Configure frontend (optional)

```bash
cd frontend
cp .env.example .env
```

Default API URL is `http://localhost:3001` — only change if your backend runs elsewhere.

### 4. Run both servers

**Terminal 1 — backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

### 5. Verify

```bash
curl http://localhost:3001/health
# → {"status":"ok"}

curl http://localhost:3001/api/work-insights
# → JSON with insights (may take 10–60s on first load)
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Backend server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |
| `ZENDESK_SUBDOMAIN` | **Yes** | — | e.g. `z3n-yourname` |
| `ZENDESK_EMAIL` | **Yes** | — | Zendesk agent email |
| `ZENDESK_API_TOKEN` | **Yes** | — | Zendesk API token |
| `AI_GATEWAY_API_KEY` | **Yes** | — | AI Gateway bearer token |
| `AI_GATEWAY_BASE_URL` | **Yes** | — | `https://ai-gateway.zende.sk/v1` |
| `AI_GATEWAY_MODEL` | No | `gpt-5.5` | Model for **per-ticket** summaries (OpenAI path) |
| `AI_GATEWAY_BEDROCK_BASE_URL` | No | `https://ai-gateway.zende.sk/bedrock` | Bedrock base URL for work insights |
| `AI_GATEWAY_MODEL_WORK_INSIGHTS` | No | `us.anthropic.claude-sonnet-4-6` | Claude model ID for **work insights** |
| `SUMMARY_CACHE_TTL_MS` | No | none | Per-ticket summary cache TTL in ms |
| `WORK_INSIGHTS_MAX_TICKETS` | No | `500` | Max tickets fetched from Zendesk for insights |
| `WORK_INSIGHTS_AI_TICKET_LIMIT` | No | `300` | Max tickets sent to AI after filter/sort |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:3001` | Backend API base URL |

### Example `backend/.env`

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173

ZENDESK_SUBDOMAIN=z3n-yourname
ZENDESK_EMAIL=you@example.com
ZENDESK_API_TOKEN=your_zendesk_api_token

AI_GATEWAY_API_KEY=your_ai_gateway_key
AI_GATEWAY_BASE_URL=https://ai-gateway.zende.sk/v1
AI_GATEWAY_MODEL=gpt-5.5

AI_GATEWAY_BEDROCK_BASE_URL=https://ai-gateway.zende.sk/bedrock
AI_GATEWAY_MODEL_WORK_INSIGHTS=us.anthropic.claude-sonnet-4-6

WORK_INSIGHTS_MAX_TICKETS=500
WORK_INSIGHTS_AI_TICKET_LIMIT=300
```

> **Important:** Per-ticket summaries and work insights use **different AI Gateway APIs**. Claude models use the Bedrock endpoint (`/bedrock/model/.../invoke`), not the OpenAI `/chat/completions` path. Do not put a Bedrock model ID in `AI_GATEWAY_MODEL`.

---

## API reference

All error responses use:

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server health check |

### Tickets

| Method | Path | Query / body | Response |
|--------|------|--------------|----------|
| `GET` | `/api/tickets` | `page`, `per_page` (max 100), optional `q`, `status`, `priority` | `{ tickets, meta }` |
| `GET` | `/api/tickets/:id` | — | `{ ticket, comments }` |

### Per-ticket AI summary

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/tickets/:id/summary` | `{ "forceRefresh": true }` optional | `SummaryResponse` |

**`SummaryResponse`:**

```json
{
  "ticketId": 42,
  "cached": false,
  "generatedAt": "2026-06-29T12:00:00.000Z",
  "summary": {
    "mainIssue": "...",
    "priorityAssessment": "High",
    "priorityReasoning": "...",
    "currentStatus": "...",
    "recommendedNextSteps": ["...", "..."]
  }
}
```

### Work insights

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/work-insights` | Queue-level AI summary of open/pending tickets |

**`WorkInsightsResponse`:**

```json
{
  "ticketCount": 120,
  "analyzedCount": 48,
  "generatedAt": "2026-06-29T12:00:00.000Z",
  "insights": {
    "headline": "Summary of your work",
    "summary": "you have 6 urgent priority tickets about critical system issues and 16 high priority tickets about billing and auth.",
    "themes": [
      { "count": 6, "priority": "urgent", "theme": "critical system failures" },
      { "count": 16, "priority": "high", "theme": "auth and billing issues" }
    ]
  }
}
```

---

## Project structure

```text
zendesk_ticket_summarizer/
├── README.md
├── backend/
│   ├── .env.example
│   └── src/
│       ├── index.ts                 # Express app entry
│       ├── types/index.ts           # Shared TypeScript contracts
│       ├── routes/
│       │   ├── tickets.ts           # List + detail
│       │   ├── summary.ts           # POST per-ticket summary
│       │   └── workInsights.ts      # GET queue insights
│       ├── services/
│       │   ├── zendeskService.ts    # Zendesk REST client
│       │   ├── aiGatewayService.ts  # OpenAI + Bedrock AI calls
│       │   ├── buildSummaryPrompt.ts
│       │   ├── buildWorkInsightsPrompt.ts
│       │   ├── workInsightsSnapshots.ts  # filter, sort, cap
│       │   └── summaryCache.ts      # Per-ticket summary cache
│       └── __tests/
└── frontend/
    ├── .env.example
    └── src/
        ├── App.tsx                  # Router + layout
        ├── api/ticketApi.ts         # Backend HTTP client
        ├── hooks/                   # useTickets, useWorkInsights, etc.
        ├── components/
        │   ├── workspace/           # Split panels, list + detail
        │   ├── list/                # Table, search, work insights card
        │   ├── detail/              # Hero, description, comments
        │   ├── summary/             # AI summary zone
        │   ├── layout/              # App shell, top bar
        │   └── shared/              # Tags, alerts, skeletons
        └── __tests/
```

---

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run Jest tests (67 tests) |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run Jest + React Testing Library (10 tests) |
| `npm run lint` | Run oxlint |

---

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Production build check
cd frontend && npm run build
cd backend && npm run build
```

Backend tests mock Zendesk and AI Gateway — no live credentials needed for `npm test`.

---

## Keyboard shortcuts

Press `?` in the ticket list to open the help dialog.

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `↑` `↓` | Move between tickets |
| `Enter` | Open focused ticket |
| `?` | Show keyboard shortcuts |
| `Esc` | Close dialog / return to list |

---

## Design decisions

| Decision | Rationale |
|----------|-----------|
| **Backend proxy** | Keeps Zendesk + AI credentials off the browser |
| **GPT for tickets, Claude for queue** | Ticket summaries fit chat completion; queue analysis uses Bedrock Claude |
| **No work insights cache** | Simpler UX — one automatic fetch per page load |
| **No work insights refresh button** | Avoids stale-cache confusion; reload page for fresh analysis |
| **Open/pending only for insights** | Agents care about active work, not solved tickets |
| **Subject-only for insights** | Token-efficient; 300 tickets fit in one prompt |
| **Hybrid search** | 1 char = instant client-side filter on current page; 2+ chars = debounced Zendesk Search API across account; work insights unaffected |

---

## Troubleshooting

### `403 Forbidden` / `RBAC: access denied` on ticket summary
- Your AI Gateway token may not have permission for `AI_GATEWAY_MODEL`
- Create a new token at [https://ai-gateway.zende.sk/tokens/create](https://ai-gateway.zende.sk/tokens/create)
- Confirm the model (e.g. `gpt-5.5`) is enabled for your account

### `404` — model does not exist (work insights)
- You may have put a **Bedrock/Claude model ID** on the OpenAI path
- Work insights must use `AI_GATEWAY_MODEL_WORK_INSIGHTS` with Bedrock format, e.g. `us.anthropic.claude-sonnet-4-6`
- Ensure `AI_GATEWAY_BEDROCK_BASE_URL=https://ai-gateway.zende.sk/bedrock`

### Work insights slow or times out
- First load fetches up to 500 Zendesk tickets + calls Claude — can take **10–60 seconds**
- Reduce `WORK_INSIGHTS_MAX_TICKETS` or `WORK_INSIGHTS_AI_TICKET_LIMIT` in `.env`

### CORS errors in browser
- Ensure `CORS_ORIGIN` in `backend/.env` matches your frontend URL (`http://localhost:5173`)
- Restart backend after changing `.env`

### Ticket list empty or errors
- Verify `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN`
- Check backend terminal for Zendesk error codes

---

## Demo script (5 minutes)

1. **Open app** — show 60/40 agent workspace
2. **Work insights card** — point out urgent/high themes and priority tags
3. **Search** — filter tickets; note insights card stays the same (queue-wide)
4. **Open a ticket** — show description + comment thread
5. **Generate Summary** — show structured AI output (issue, priority, next steps)
6. **Refresh summary** — show regeneration after new context
7. **Optional API proof:**
   ```bash
   curl -s http://localhost:3001/api/work-insights | python3 -m json.tool
   ```

---

## Validating work insights

Work insights are **AI-grouped estimates** from ticket subjects — not a compliance report.

To validate in front of your team:
1. Read the summary sentence aloud
2. Show `themes` array from `GET /api/work-insights`
3. Spot-check one theme in Zendesk (filter open/pending + priority, search subjects)
4. Explain: *“This helps agents triage — it’s grounded in real ticket data, grouped by AI.”*

---

## License

ISC (see `backend/package.json`).
