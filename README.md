# SearchAI (Gokaist)

AI 도구 추천 챗봇 서비스. 사용자가 작업 내용을 입력하면 Groq AI가 DB에 등록된 40여 개의 AI 도구 중 가장 적합한 것을 추천해준다.

## Link

[https://searchai.sungju.xyz](https://searchai.sungju.xyz)

## Features

- **채팅 인터페이스** (`/`) — 질문을 입력하면 AI가 실시간 스트리밍으로 추천 결과를 응답
- **탐색 뷰** (`/second`) — 카드 기반 UI, 검색 기록 저장 및 페르소나(직업/나이/관심 분야) 설정 지원
- **관리자 페이지** (`/admin`) — 비밀번호 인증 기반 AI 도구 추가/삭제
- **SSE 스트리밍** — Groq API의 스트리밍 응답을 Server-Sent Events로 실시간 전송
- **자동 시딩** — 서버 시작 시 `agents` 테이블이 비어있으면 `ai.json`의 40개 도구 자동 upsert

## Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js, Express 5 |
| Database | Supabase (PostgreSQL) |
| AI | Groq SDK (llama-3.3-70b-versatile) |
| Frontend | Vanilla HTML/CSS/JS (SPA) |
| Deploy | Docker, Kubernetes |

## Directory Structure

```
gokaist/
├── index.js              # Express 서버 (API + static serving)
├── ai.json               # 시드 데이터 (AI 도구 40개)
├── package.json
├── Dockerfile
├── .env                  # 환경변수 (git 제외)
├── .gitignore
├── db/
│   └── db.js             # Supabase 클라이언트 (CRUD)
├── public/
│   ├── index.html        # 채팅 UI (메인 페이지)
│   ├── style.css         # 채팅/공통 스타일
│   ├── script.js         # 채팅 프론트엔드 로직
│   ├── second.html       # 탐색 페이지 (카드 뷰)
│   ├── second.css        # 탐색 페이지 스타일
│   ├── second.js         # 탐색 페이지 로직
│   ├── admin.html        # 관리자 페이지
│   ├── admin.css         # 관리자 스타일
│   └── admin.js          # 관리자 로직
├── docs/
│   ├── idea.md           # 기획 문서
│   ├── api.md            # API 명세
│   └── db.md             # DB 명세
├── k8s/
│   ├── namespace.yaml    # Kubernetes 네임스페이스
│   └── secrets.yaml      # Kubernetes 시크릿
└── HANDOFF.md            # 프로젝트 인계 문서
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase 프로젝트
- Groq API 키

### Environment Variables

```bash
# .env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<your-supabase-anon-key>
GROQ_API_KEY=<your-groq-api-key>
ADMIN_PASSWORD=<admin-password>
```

`dotenv`가 자동 로드하므로 별도의 export는 불필요.

### Install & Run

```bash
npm install
npm run dev    # 또는 node index.js
```

### Database Setup

Supabase SQL Editor에서 다음 DDL을 실행:

```sql
CREATE TABLE agents (
    name TEXT PRIMARY KEY,
    great TEXT NOT NULL
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON agents FOR ALL USING (true) WITH CHECK (true);
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | - | SPA 메인 페이지 |
| GET | `/api/agents` | - | 등록된 AI 도구 목록 조회 |
| POST | `/api/v1/search` | - | AI 도구 추천 (비스트리밍) |
| POST | `/api/v1/search/stream` | - | AI 도구 추천 (SSE 스트리밍) |
| POST | `/api/v1/admin/verify` | - | 관리자 비밀번호 검증 |
| POST | `/api/v1/admin/ai` | Bearer | AI 도구 추가 |
| DELETE | `/api/v1/admin/ai/:name` | Bearer | AI 도구 삭제 |

상세 스펙은 [docs/api.md](docs/api.md) 참조.

## Deployment

### Docker

```bash
docker build -t searchai .
docker run -p 3000:3000 --env-file .env searchai
```

### Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
# deployment + service는 별도 구성 필요
```

## License

ISC
