# Project State

## Quick Summary
- Next.js 14+ responsive web app initialized with TypeScript, App Router, and Vanilla CSS.
- PostgreSQL 16 local database set up with `pgvector` extension.
- Prisma 7 models created and successfully migrated (with HNSW vector index).
- Database singleton client pool configured and validated.
- **[Completed]** Story S1-1: Zustand client state store, Landing page, Onboarding wizard, and save API.
- **[Completed]** Story S1-2: Pension Calculation Engine (calculating 3-tier payouts and 2026 reform schedules) and Dashboard UI integrated with Recharts Donut & Stacked Area charts.
- **[Completed]** Story S1-3: YouTube Expert Content Crawler and RAG Chat Q&A API using pgvector and OpenAI.
- **[Completed]** Story S2-1: YouTube Video Player Modal integration in RAG Q&A Chat.
- **[Completed]** Story S2-2: Premium Report PDF Generation & Toss Payments mock integration.
- **[Completed]** Story S2-3: NPS Codef API Sync Mock & Onboarding Integration.
- **[Completed]** Story S3-1: Zustand LocalStorage Caching & Hydration Patch.
- **[Completed]** Story S3-2: JSON Backup Export/Import & Privacy Warning Banner.
- **[Completed]** Story S4-1: Prisma Client Generation & Vercel/Render Cloud Deployment Configuration (with DB SSL & Gemini API Support).

## Active Sprint / Story
- **Sprint 5**: UI/UX ETF Lens Theme Sync — **COMPLETED**
- **[Completed]** Story S5-1: CSS Variable Theme Integration for ETF Lens Look & Feel
  - globals.css: Indigo/Violet/Orange HSL token palette applied
  - dashboard/page.tsx: All chart colors (PieChart, AreaChart), badge backgrounds, glow effects, AI card, data alert unified to new theme (removed legacy mint green rgba(0, 184, 148))
  - All hardcoded hex (#4f46e5, var(--info)) replaced with HSL or CSS variable references
- **[Completed]** Story S5-2: PDF Viewer Load Fix, Fullscreen Transition & Button/Badge Styling Optimizations
  - PdfViewerModal.tsx: Configured local pdf.worker.min.mjs path to resolve CDN loading issue.
  - PdfViewerModal.tsx: Expanded overlay and modal layouts to take up the full screen height (excluding 70px header).
  - page.tsx & onboarding/page.tsx: Replaced white/light backgrounds of "2026 개혁안 배지" and onboarding addition buttons ("+ 리스트에 추가하기", "+ 연금저축/보험 추가") with dark indigo background (`rgba(99, 102, 241, 0.15)`) and light contrast label text (`#a5b4fc`).

