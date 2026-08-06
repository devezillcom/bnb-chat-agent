# BNB Chat Agent

Barebone scaffold for a chat-agent platform, based on the [boxx-blog](https://github.com) tech stack.

## Stack

- **Next.js 16** (App Router, standalone output)
- **PostgreSQL** + Drizzle ORM (Neon serverless)
- **Firebase Auth** (client) + Admin SDK (server, httpOnly cookie session)
- **LangChain / LangGraph** (chat agents with Postgres checkpointer)
- **Upstash** QStash (background jobs) + Redis (cache/coordination)
- **Cloudflare R2** (S3-compatible uploads)
- **Firebase RTDB** (realtime notifications / job status)

## Getting started

1. Copy env template and fill in values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Push database schema:

   ```bash
   npm run db:push
   ```

4. Run dev server:

   ```bash
   npm run dev
   ```
