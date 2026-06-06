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
- **[Completed]** Story S5-2: PDF Viewer Load Fix, Aligned Width & PDF Documents Integration
  - PdfViewerModal.tsx: Configured local pdf.worker.min.mjs path to resolve CDN loading issue.
  - PdfViewerModal.tsx: Adjusted overlay and modal width to align perfectly with the header contents (width: 100%, max-width: 1200px, padding: 0 40px, top: 70px).
  - page.tsx: Integrated new document "2026_Pension_Reform.pdf" on clicking "연금 개혁안 정보" nav link, dynamically passing pdfUrl and title to PdfViewerModal.
  - page.tsx & onboarding/page.tsx: Replaced white/light backgrounds of "2026 개혁안 배지" and onboarding addition buttons ("+ 리스트에 추가하기", "+ 연금저축/보험 추가") with dark indigo background (`rgba(99, 102, 241, 0.15)`) and light contrast label text (`#a5b4fc`).
- **[Completed]** Story S5-3: Hero Section Simplification & 3-Tier Pension Diagram Integration
  - page.tsx: Decreased heroSection top padding (from 120px to 50px) to shift the slogan upwards.
  - page.tsx: Deleted "무료로 3층 연금 설계하기" CTA button and all content elements below it (Stats Row, Features Grid, Trust Card, and Footer) to simplify the viewport.
  - page.tsx: Added a white frame card container (diagramContainer) with 20px rounding, border, and drop-shadow under the slogan to display the 3-tier structure diagram (pension_structure.png).
  - page.tsx: Cleaned up and removed all unused styling objects in the styles constant.
- **[Completed]** Story S5-4: Viewport Optimization for Hero Section
  - page.tsx: Removed the "2026 국민연금 개혁안 공식 반영" badge box to save vertical space.
  - page.tsx: Shrunk heroTitle font size (from 3.5rem to 2.5rem) and margins, and heroSubtitle font size (from 1.15rem to 1rem) and margins.
  - page.tsx: Decreased padding in heroSection (to 32px 20px 16px 20px) and margin/padding in diagramContainer (to 16px padding, 40px margin) to fit the diagram image perfectly in a single viewport.
  - page.tsx: Safely removed the unused badge styling property from the styles object.

