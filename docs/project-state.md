# Project State

## Quick Summary
- Next.js 14+ responsive web app initialized with TypeScript, App Router, and Vanilla CSS.
- PostgreSQL 16 local database set up with `pgvector` extension.
- Prisma 7 models created and successfully migrated (with HNSW vector index).
- Database singleton client pool configured and validated.
- **[Completed]** Story S1-1: Zustand client state store, Landing page, Onboarding wizard, and save API.
- **[Completed]** Story S1-2: Pension Calculation Engine (calculating 3-tier payouts and 2026 reform schedules) and Dashboard UI integrated with Recharts Donut & Stacked Area charts and live simulation sliders.
- **[Completed]** Story S1-3: YouTube Expert Content Crawler (`npx tsx scripts/crawl-youtube.js`) and database seeder, along with an interactive RAG Chat Q&A API (`/api/ai/advice`) using pgvector cosine distance matches and OpenAI completions (with keyword fallback).

## Active Sprint / Story
- **Sprint 1**: Foundation & Onboarding (All Stories Completed! 🏁)
- **Active Story**: Next Session Sprint 2 (NPS Codef API Integration, MyData, Reports & Staging Deploy)
