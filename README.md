# SiteWing AI

SiteWing turns a business description into a validated, typed website configuration and renders it with reusable React components.

## Local setup

Install dependencies:

```bash
npm install
```

Create a Supabase project, apply the migrations in `supabase/migrations` in
timestamp order, and copy
`.env.example` to `.env.local`. Fill in:

```bash
OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_server_secret_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITEWING_ROOT_DOMAIN=sitewing.ai
SITEWING_PUBLIC_ORIGIN=https://sitewing.ai
SITEWING_APP_HOSTNAMES=your-site.netlify.app
NETLIFY_SITE_ID=your_netlify_project_id
NETLIFY_AUTH_TOKEN=your_server_only_netlify_token
NETLIFY_CUSTOM_DOMAIN_TARGET=your-site.netlify.app
NETLIFY_APEX_DOMAIN_TARGET=apex-loadbalancer.netlify.com
NETLIFY_APEX_FALLBACK_IP=75.2.60.5
```

`SUPABASE_SECRET_KEY` is a server-only Supabase secret key used to read active
published snapshots and stream only their indexed media. Never prefix it with
`NEXT_PUBLIC_` or expose it to browser code. Apply the Phase 12 migration with
`supabase db push` when using the Supabase CLI, or run
`supabase/migrations/20260901020000_phase12_publishing.sql` in the SQL editor
after the Phase 10 and Phase 11 migrations.

Apply `supabase/migrations/20260901030000_phase13_domains.sql` after Phase 12.
It creates the private domain registry, ownership policies, indexes, SiteWing
subdomain backfill, and the publication trigger that reserves future SiteWing
subdomains.

`NETLIFY_AUTH_TOKEN` and `SUPABASE_SECRET_KEY` are server-only. Netlify's current
Next.js adapter is automatically selected at deploy time; do not pin the legacy
plugin. Set the Netlify target variables to the exact values shown for the
production project, especially if the project uses High-Performance Edge.

## Production domains

Use a single Netlify project for SiteWing. Add `sitewing.ai` as its production
domain and configure Netlify DNS for `sitewing.ai`. Add `*.sitewing.ai` to that
same project once; Netlify DNS then provides wildcard DNS and a managed wildcard
certificate. The application resolves the first label as the stable publication
slug.

Custom domains are added as aliases to that same project only after SiteWing
finds the exact ownership TXT record and the routing record. For external DNS:

- subdomains use a CNAME to `NETLIFY_CUSTOM_DOMAIN_TARGET`;
- apex domains use an ALIAS/ANAME/flattened CNAME to
  `NETLIFY_APEX_DOMAIN_TARGET`, or the configured fallback A record;
- ownership uses `_sitewing-verification.<domain>` with the unique value shown
  in the builder.

Netlify provisions and renews HTTPS after the alias has valid DNS. Netlify
currently recommends no more than 50 aliases on one project; validate the
required Netlify plan or arrange a higher-scale domain product with Netlify
before exceeding that operating range.

Local DNS is not required. `/site/<slug>` remains supported. Host routing can be
simulated with `curl -H 'Host: <slug>.localhost:3000' http://127.0.0.1:3000/`.

In Supabase Authentication URL configuration, add
`http://localhost:3000/auth/confirm` as an allowed redirect URL. For SSR email
confirmation, configure the Confirm signup email link as:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000/signup](http://localhost:3000/signup), create an
account, then create a project from the dashboard.

## Quality checks

```bash
npm run lint
npm run build
```

## Current scope

- Typed `WebsiteConfig` rendering system
- Server-side OpenAI Responses API generation
- Structured output and application-level validation
- Supabase email/password authentication with SSR cookie sessions
- Private saved projects and durable conversation history protected by RLS
- Validated, debounced project autosave
- In-memory Undo/Redo history that intentionally resets after reload
- Private Supabase Storage image uploads with stable project media references
- Explicit published snapshots with stable `/site/[slug]` public routes
- Server-gated public delivery for only the media referenced by active snapshots
- Hostname-aware SiteWing subdomains and verified Netlify custom-domain aliases
- Legacy temporary browser images that safely normalize to placeholders
- No billing, analytics, forms, or code export
