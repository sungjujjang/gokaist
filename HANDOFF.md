# Gokaist Handoff

## 프로젝트 개요
AI 도구 추천 챗봇 서비스. 사용자가 작업 내용을 입력하면 Groq AI가 DB에 등록된 AI 도구 중 가장 적합한 것을 추천해준다.

## 디렉토리 구조
```
gokaist/
├── index.js          # Express 서버 (API + static serving)
├── db/
│   ├── db.js         # Supabase 클라이언트 (CRUD)
│   └── init.sql      # Supabase SQL Editor에서 실행할 DDL
├── public/
│   ├── index.html    # 채팅 UI (메인 페이지)
│   ├── style.css     # 스타일
│   └── script.js     # 프론트엔드 로직
├── docs/
│   ├── api.md        # API 명세
│   ├── db.md         # DB 명세
│   └── idea.md       # 기획 문서
├── ai.json           # 시드 데이터 (AI 도구 40개, 이름/장점)
├── .env              # 환경변수 (SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY)
├── package.json
├── .gitignore        # node_modules/, .env
└── HANDOFF.md
```

## 스택
- **Runtime**: Node.js (Express 5)
- **DB**: Supabase (PostgreSQL) - `@supabase/supabase-js`
- **AI**: Groq SDK (`groq-sdk`) - llama-3.3-70b-versatile
- **Frontend**: Vanilla HTML/CSS/JS (SPA)

## 환경변수 (`.env`)
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<your-supabase-anon-key>
GROQ_API_KEY=<your-groq-api-key>
```

`dotenv`가 자동 로드하므로 export 불필요. `.env`는 `.gitignore`에 등록됨.

## Supabase 연결 정보
- URL: `SUPABASE_URL` env var 참조
- 직접 PG 연결: Supabase Dashboard → Project Settings → Database에서 확인

## DB 테이블 (`agents`)
```sql
CREATE TABLE agents (
    name TEXT PRIMARY KEY,
    great TEXT NOT NULL
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON agents FOR ALL USING (true) WITH CHECK (true);
```

테이블명은 소문자 `agents`. PostgreSQL이 unquoted identifier를 lowercase로 저장하기 때문.

## API 엔드포인트

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | index.html (SPA) |
| GET | `/api/agents` | 등록된 모든 AI 도구 목록 |
| POST | `/api/v1/search` | AI 도구 추천 검색 |
| POST | `/api/v1/admin/ai` | AI 도구 추가 |
| DELETE | `/api/v1/admin/ai/:name` | AI 도구 삭제 |

### POST /api/v1/search
```json
// Request
{ "query": "이미지 생성하고 싶어요" }

// Response
{
  "name": "Midjourney",
  "reason": "...",
  "tip": "..."
}
```

Groq AI가 DB의 agents 데이터를 system prompt에 넣어 가장 적합한 도구를 JSON으로 응답.

## 실행 방법
```bash
npm install
npm run dev    # 또는 node index.js
```

`seedDB()`는 서버 시작 시 백그라운드에서 실행되며, `agents` 테이블이 비어있을 때만 `ai.json`의 40개 데이터를 upsert한다.

## 주의사항
1. Express 5 사용 - wildcard 라우트는 `'/{*path}'` 문법 사용 (Express 4의 `'*'` 아님)
2. Supabase anon key (`sb_publishable_...`)는 `SUPABASE_KEY` env var로 전달
3. `init.sql`은 Supabase SQL Editor에서 수동 실행 필요 (첫 셋업 시)
4. AI 응답이 한글로 나오도록 system prompt에 "(in Korean)" 명시됨
