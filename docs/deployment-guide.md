# PensionLab Render & Vercel 클라우드 배포 가이드

본 가이드는 Local 환경에서 개발된 PensionLab Next.js 풀스택 애플리케이션을 **Vercel**(웹 서버 및 Serverless API 호스팅)과 **Render**(Managed PostgreSQL + pgvector 데이터베이스)를 활용해 퍼블릭 클라우드 환경에 성공적으로 배포 및 연동하는 절차를 설명합니다.

---

## 🗺️ 배포 아키텍처 개요

```mermaid
graph TD
    User([사용자 브라우저]) <--> Vercel[Vercel Cloud - Next.js App Router]
    Vercel <--> Render[Render Cloud - Managed PostgreSQL]
    Vercel <--> Gemini[Google Gemini API]
```

- **Vercel**: Full-stack Next.js 애플리케이션 빌드, 배포 및 API 라우트(Serverless) 호스팅
- **Render**: Managed PostgreSQL 데이터베이스 인스턴스 (pgvector 및 SSL 강제 보안 연결)
- **Gemini API**: 전문가 지식 기반 RAG 상담을 위한 임베딩 및 요약문 생성 API

---

## 🛠️ Step-by-Step 배포 절차

### Step 1. Render Managed PostgreSQL 데이터베이스 구축

1. **Render 대시보드 로그인**: [render.com](https://render.com)에 로그인합니다.
2. **New PostgreSQL 생성**:
   - 우측 상단의 **New +** 버튼을 누르고 **Database**를 선택합니다.
   - **Name**: `pensionlab-db`
   - **Database**: `pensionlab_db`
   - **User**: `pensionlab_db_user`
   - **Region**: 프론트엔드와 지연시간을 줄이기 위해 가까운 리전(예: Singapore 또는 Tokyo)을 권장합니다.
   - **Instance Type**: 테스트를 위해 **Free** 플랜 또는 상위 플랜을 선택합니다.
3. **Connection String 복사**:
   - 데이터베이스 생성이 완료되면 대시보드 내 **Connection** 섹션에서 **External Connection String**(`postgresql://...`)을 복사하여 안전한 곳에 기록해 둡니다.

---

### Step 2. 원격 데이터베이스 스키마 마이그레이션 (로컬에서 수행)

Render PostgreSQL은 외부 연결 시 **SSL/TLS 연결을 필수로 강제**하므로, 로컬 환경에서 원격 DB에 Prisma 스키마를 심기 위해 데이터베이스 주소 끝에 `?sslmode=require` 를 추가해주어야 합니다.

로컬 터미널에서 다음 명령을 실행하여 데이터베이스 마이그레이션을 배포합니다:

```bash
DATABASE_URL="postgresql://pensionlab_db_user:[PASSWORD]@dpg-[RENDER_HOST].singapore-postgres.render.com/pensionlab_db?sslmode=require" npx prisma migrate deploy
```

> [!NOTE]
> `migrate deploy` 명령은 로컬의 마이그레이션 히스토리 파일(`prisma/migrations/*`)을 읽어 원격 데이터베이스에 테이블 스키마와 pgvector HNSW 인덱스를 안정적으로 적용합니다.

---

### Step 3. 유튜브 전문가 RAG 데이터 시딩 (로컬에서 수행)

원격 데이터베이스 스키마 생성이 끝난 후, RAG 상담실에서 참고할 전문가 자막 데이터를 데이터베이스에 적립하기 위해 YouTube 크롤러 시더 스크립트를 실행합니다.

```bash
DATABASE_URL="postgresql://pensionlab_db_user:[PASSWORD]@dpg-[RENDER_HOST].singapore-postgres.render.com/pensionlab_db?sslmode=require" Gemini_API_KEY="[YOUR_GEMINI_API_KEY]" npx tsx scripts/crawl-youtube.js
```

- 본 스크립트는 공식 `@google/generative-ai` SDK를 사용해 `gemini-embedding-2` 모델로 3072차원 임베딩을 생성한 후, DB 스키마인 1536차원에 맞게 자동으로 **슬라이싱(slice)**하여 데이터베이스에 적립합니다.
- Gemini Free Tier API Key의 경우 분당 요청 쿼터 제한(429)으로 인해 요약문 생성 시 Fallback 텍스트가 채워질 수 있으나, 전체 시딩 흐름은 정상 완료됩니다.

---

### Step 4. Github 소스 코드 Push

1. PensionLab 프로젝트 루트 디렉토리에서 Git 저장소를 초기화하고 커밋합니다 (이미 진행됨).
2. GitHub에서 New Repository를 생성합니다 (예: `pension-lab`).
3. GitHub 저장소에 코드를 Push합니다:
   ```bash
   git remote add origin https://github.com/[YOUR_GITHUB_ID]/[YOUR_REPO_NAME].git
   git branch -M main
   git push -u origin main
   ```

---

### Step 5. Vercel에 Next.js 서비스 배포 및 환경 변수 주입

1. **Vercel 대시보드 로그인**: [vercel.com](https://vercel.com)에 로그인합니다.
2. **프로젝트 연동**:
   - **Add New > Project**를 선택한 후, Step 4에서 Push한 GitHub 저장소를 Import합니다.
3. **환경 변수(Environment Variables) 설정**:
   - **DATABASE_URL**: Render에서 복사한 External Connection String 주소 끝에 `?sslmode=require` 를 붙여 입력합니다.
     - 예: `postgresql://pensionlab_db_user:[PASSWORD]@dpg-[RENDER_HOST].singapore-postgres.render.com/pensionlab_db?sslmode=require`
   - **Gemini_API_KEY**: 사용자의 Google Gemini API Key
   - **NEXT_PUBLIC_APP_URL**: Toss Payments 등의 리다이렉트 URL 처리를 위해 Vercel에서 발급될 도메인 주소 (예: `https://pensionlab.vercel.app`)
4. **Deploy 실행**:
   - **Deploy** 버튼을 클릭하여 빌드를 시작합니다.
   - `package.json`의 빌드 단계에서 `prisma generate && next build` 가 자동 작동하여 최적화된 프로덕션 빌드가 완성됩니다.

---

## 🔒 운영 중 유의사항

1. **서버리스 커넥션 관리**:
   - Vercel은 서버리스 환경이므로 동시 접속자가 많을 경우 DB Connection Pool이 Render DB의 한도를 초과할 수 있습니다.
   - PensionLab은 이미 `src/config/db.ts` 또는 `src/services/db.ts` 내에서 싱글톤 Prisma Client 인스턴스를 유지하여 커넥션을 관리하고 있으나, 필요시 Render DB 대시보드에서 커넥션 제한을 증설하거나 PgBouncer 등의 풀러를 연동할 수 있습니다.
2. **API Key 보안**:
   - 절대 `Gemini_API_KEY` 또는 데이터베이스 비밀번호를 `.env` 파일 등에 하드코딩하여 GitHub에 Push하지 마십시오. 항상 Vercel 및 Render 대시보드의 **Environment Variables** 기능을 통해 관리해야 합니다.
