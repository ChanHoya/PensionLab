# PensionLab 🚀

> 한국의 복잡한 연금제도를 사용자의 수동 입력 정보를 기반으로 통합 분석하고, AI 기반 전략 추천과 실시간 시뮬레이션을 제공하는 반응형 웹 설계 플랫폼 (PC & 모바일 동시 지원)

[![Status](https://img.shields.io/badge/Status-MVP-yellow)]()
[![Node](https://img.shields.io/badge/Node-18%2B-green)]()
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black)]()

## 🎯 핵심 기능

- **3층 연금 통합 대시보드** - 국민연금, 기초연금, 퇴직연금, 개인연금 현황을 반응형 원형 그래프로 한눈에 파악
- **MVP 다층 연금 수동 입력 시스템** - 복잡한 API 연동 없이 필수 항목(국민연금 9대 항목, 기초연금 소득인정액, 퇴직/개인연금 적립금 등)을 수기로 입력받아 빠르고 정확한 연금 시뮬레이션 및 설계 수행
- **AI 연금 시뮬레이터** - 수급 시점별, 기대수명별, 물가상승률별 실시간 시뮬레이션
- **2026년 연금 개혁 완전 반영** - 보험료 9%→13% 인상 스케줄(세대별 차등 적용) 및 소득대체율 41.5%→43% 반영
- **유튜브 전문가 콘텐츠 통합** - 연금박사, 박곰희TV 등 검증된 유튜브 채널의 자막을 Whispher/무료 자막 파싱으로 추출하여 RAG 기반으로 답변 제공
- **한시적 전면 무료 서비스** - 초기 사용자 기반 확보를 위해 전면 무료 운영 (구독 모델 추후 고려)

## 📂 프로젝트 구조

```
pensionlab/
├── src/
│   ├── app/                  # Next.js App Router (페이지 및 API 라우트)
│   │   ├── api/              # 백엔드 API Routes
│   │   │   ├── pension/      # 연금 계산 및 시뮬레이션 API
│   │   │   ├── content/      # YouTube 전문가 콘텐츠 검색 API
│   │   │   ├── news/         # 실시간 연금 뉴스 API
│   │   │   └── ai/           # RAG 연금 상담 API
│   │   ├── dashboard/        # 대시보드 화면
│   │   ├── simulator/        # 시뮬레이터 화면
│   │   ├── news/             # 연금 뉴스 및 정책 화면
│   │   ├── page.tsx          # 랜딩 페이지
│   │   └── layout.tsx        # 글로벌 레이아웃
│   ├── components/           # 반응형 재사용 가능 UI 컴포넌트
│   │   ├── ui/               # 공통 UI 요소 (Button, Card, Input 등)
│   │   └── charts/           # Recharts 기반 시각화 컴포넌트
│   ├── services/             # 비즈니스 로직 (연금 계산 모듈, RAG 검색 서비스)
│   ├── config/               # Prisma DB 클라이언트 및 환경변수 설정
│   ├── store/                # Zustand 클라이언트 상태 관리
│   └── utils/                # 유틸리티 (포맷터, 수학 로직 등)
├── prisma/
│   ├── schema.prisma         # PostgreSQL DB 스키마 (pgvector 포함)
│   └── migrations/           # DB 마이그레이션 이력
├── scripts/
│   └── crawl-youtube.js      # YouTube 자막 크롤링 및 Embedding 배치 스크립트
├── tailwind.config.ts        # Tailwind CSS 설정
├── package.json              # 의존성 및 스크립트 정의
└── tsconfig.json             # TypeScript 설정
```

## 🛠 기술 스택

### Web Application (Frontend + Backend API)
- **Framework**: **Next.js** 14+ (App Router, TypeScript)
- **Styling**: **Tailwind CSS** or **Vanilla CSS Modules** (반응형 레이아웃)
- **Database**: **PostgreSQL** (Vector Embedding을 위한 **pgvector** 확장 기능 필수)
- **ORM**: **Prisma ORM**
- **AI/LLM**: **OpenAI GPT-4 API** (자막 요약, RAG 검색 및 임베딩 생성)
- **State Management**: **Zustand** (클라이언트 연금 계산 값 공유)
- **Visualization**: **Recharts** (반응형 SVG 차트)

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm or yarn
- PostgreSQL 14+ (pgvector 확장 활성화)
- OpenAI API 키
- YouTube Data API v3 키

### 개발 환경 설정 및 구동

```bash
# 의존성 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 PostgreSQL 연결 URI 및 OpenAI API Key 입력

# 데이터베이스 마이그레이션 실행 (pgvector 스키마 빌드)
npx prisma migrate dev

# 로컬 개발 서버 시작
npm run dev

# YouTube 전문가 채널 크롤링 (배치 작업 테스트)
npm run crawl -- --channel pension500 --limit 5

# 테스트 코드 실행 (Jest/Vitest)
npm test
```

웹 서비스는 `http://localhost:3000` 에서 확인하실 수 있습니다.

## 📡 API 엔드포인트

### Pension (연금)
- `POST /api/pension/calculate` - 수동 입력 값을 바탕으로 국민연금 예상액 계산
- `POST /api/pension/compare-scenarios` - 연령별/소득별 시나리오 비교
- `GET /api/pension/reform-info` - 2026년 연금 개혁안 정보 반환

### Content & AI (RAG)
- `POST /api/ai/advice` - RAG 기반 연금 상담 Q&A
- `GET /api/content/expert-tips` - 크롤링된 유튜브 요약 리스트 조회

### News
- `GET /api/news` - 실시간 수집된 연금 정책 뉴스 피드

## 🧪 테스트

```bash
npm test              # 단위 테스트 실행
npm run test:watch    # Watch 모드
```

## 📝 다음 단계

### Phase 1 (MVP) - 3개월
- [ ] Next.js 기반 단일 반응형 프로젝트 셋업 및 DB(PostgreSQL/Prisma) 마이그레이션
- [ ] 3층 연금 전체(국민연금 9대 항목, 기초연금, 퇴직연금, 연금저축, 연금보험) 수동 입력 온보딩 폼 제작
- [ ] 2026년 연금 개혁 수치(세대별 차등) 적용 계산 엔진 구현
- [ ] Recharts 활용 다층 연금 대시보드 시각화
- [ ] 유튜브 자막 무료 파싱 & pgvector RAG 파이프라인 PoC 완료
- [ ] 한시적 무료 웹 서비스 배포 및 피드백 수집

### Phase 2 (고도화) - 3개월
- [ ] [Codef API](https://developer.codef.io/products/public/each/pp/nps-my-pension) 기반 국민연금공단(NPS) 실시간 가입내역 자동 연계
- [ ] 주요 금융사 마이데이터 대행 연동 (퇴직연금/개인연금 잔액 실시간 동기화)
- [ ] RAG 영상 출처 표기 고도화 (유튜브 플레이어 임베딩)
- [ ] 토스페이먼츠 연계 1회성 정밀 분석 리포트 결제 기능 추가 검토

### Phase 3 (장기 확장) - 6개월
- [ ] B2B 기업 HR 솔루션용 화이트라벨 대시보드 구축
- [ ] 세무사/재무설계사 1:1 컨설팅 매칭 기능 추가
- [ ] 커뮤니티 및 은퇴 라이프스타일 큐레이션 플랫폼 확장

## 🤝 기여하기

이 프로젝트는 현재 기획/개발 초기 단계입니다. 기여를 환영합니다!

## 📄 라이선스

Private - All rights reserved

## 👥 팀

- 기획: PensionLab
- 개발: Mavis (AI Assistant)
- 자문: 연금 전문가 (연예 채널 큐레이션)

---

**참고 자료**:
- [2025 국민연금 개혁안](https://namu.wiki/w/2025%EB%85%84%20%EA%B5%AD%EB%AF%BC%EC%97%B0%EA%B8%88%EB%B2%95%20%EA%B0%9C%EC%A0%95)
- [연금박사 YouTube](https://www.youtube.com/@pension500)
- [박곰희TV YouTube](https://www.youtube.com/@gomhee)
- [NPS 국민연금공단](https://www.nps.or.kr/)
