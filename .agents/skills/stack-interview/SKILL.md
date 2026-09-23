---
name: stack-interview
description: Load this skill inside the Step 3 Human Checkpoint of the /ps workflow. Presents an 8-question infrastructure confirmation card with PS-inferred smart defaults. A single "proceed" reply accepts all defaults. User overrides take absolute priority and are written to docs/02-solution.md → Infrastructure Stack, which all downstream skills read.
---

# WHEN TO LOAD
Load inside Step 3 (Mandatory Human Checkpoint) of the `/ps` workflow — immediately after presenting `docs/02-solution.md` for moat approval. Do NOT create a separate pause; this runs inside the same single human stop.

# INPUTS
- `docs/01-problem.md` (Domain, technical context)
- `docs/02-solution.md` (Approved moat — infer infra defaults from here)

# OUTPUTS
- `docs/02-solution.md → ## Infrastructure Stack` section (appended after moat approval)
- `DECISIONS.md → ADR-000` updated with stack rationale

# EXECUTION PROTOCOL

## Step 1 — Infer Smart Defaults
Before presenting the card, read `docs/01-problem.md` and `docs/02-solution.md` and infer the most sensible default for each of the 8 questions. Defaults must be genuinely inferred from the PS — not always Python, not always None.

Examples of intelligent inference:
- PS involves real-time streaming data → infer Redis queue, not None
- PS is a multi-user SaaS → infer OAuth2, not JWT stateless
- PS is a CLI tool or API-only → infer no frontend
- PS uses ML model training → note this separately (handled by env-generation step)

Mark each inferred default with `[inferred]`. Mark scaffold template defaults with `[template-default]`.

## Step 2 — Present the Stack Confirmation Card

Present this card as part of the Step 3 checkpoint message (not a separate message):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK CONFIRMATION
Press "proceed" to accept all defaults, or specify overrides.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Backend language?
   Default: Python / FastAPI [template-default]
   Options: Node.js / Go / Rust / Java / Ruby / Elixir / PHP / Other

2. Frontend?
   Default: React 18 / Vite [template-default]
   Options: Next.js / SvelteKit / Vue / Nuxt / Vanilla / None (API-only)

3. Auth method?
   Default: <INFERRED — e.g. JWT stateless> [inferred]
   Options: OAuth2 (Google/GitHub) / Supabase Auth / Clerk / Auth0 / None

4. Database type?
   Default: PostgreSQL 16+ [non-negotiable — cannot be overridden]
   Note: Neon / Supabase / Docker Compose are hosting options, not DB changes.

5. Cache / Queue?
   Default: <INFERRED — None OR Redis> [inferred]
   Options: Redis (sessions only) / Redis + Celery (background jobs) / BullMQ / None

6. API Gateway?
   Default: None [template-default]
   Options: Nginx reverse proxy / Kong / Custom Go/Chi proxy / Traefik

7. Object / File Storage?
   Default: None [template-default]
   Options: Supabase Storage / S3-compatible (MinIO / AWS) / Cloudflare R2

8. Notifications / Email?
   Default: None [template-default]
   Options: Resend / SendGrid / Twilio (SMS) / Firebase FCM (push)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 3 — Record User Response

After user replies, resolve each item using the priority rule:

**Resolution order (highest wins):**
1. 🥇 **User-specified** — user named a specific choice → absolute override
2. 🥈 **Inferred from PS** — marked `[inferred]` → use if no user override
3. 🥉 **Scaffold template default** — marked `[template-default]` → fallback

Append the resolved `## Infrastructure Stack` section to `docs/02-solution.md`:

```markdown
## Infrastructure Stack
- Backend:         Python / FastAPI         [source: template-default]
- Frontend:        React 18 / Vite          [source: template-default]
- Auth:            JWT stateless            [source: inferred]
- Database:        PostgreSQL 16+           [non-negotiable]
- Cache / Queue:   Redis + Celery           [source: user-specified]
- API Gateway:     None                     [source: template-default]
- Storage:         None                     [source: template-default]
- Notifications:   Resend                   [source: user-specified]
```

Update `DECISIONS.md → ADR-000` with a one-line rationale for any non-default choice.

# EXIT CRITERIA
- [ ] `docs/02-solution.md → ## Infrastructure Stack` section exists and is fully resolved
- [ ] Every field has a `[source:]` tag
- [ ] `DECISIONS.md` reflects any user-specified non-default choices
- [ ] No new human pause was created — this ran inside Step 3

# NEXT
Step 4: env-generation reads `## Infrastructure Stack` to emit `.env.example`.
Step 7: `architecture` reads `## Infrastructure Stack` for service decomposition.
