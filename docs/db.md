# SearchAI Database Schema

## Stack

- **Database**: Supabase - (PostgreSQL)
- **Client**: `@supabase/supabase-js` + `ws` (WebSocket for realtime)
- **Table**: `agents` (단일 테이블)

---

## Table: `agents`

**PostgreSQL**은 unquoted identifier를 lowercase로 저장하므로, 테이블명과 컬럼명은 모두 소문자 `agents`로 통일한다.

### DDL

```sql
CREATE TABLE agents (
    name TEXT PRIMARY KEY,
    great TEXT NOT NULL
);
```

### Columns

| Column | Type | Constraint | Description |
|-------|------|-----------|-------------|
| name | TEXT | PRIMARY KEY | AI 도구 이름 (예: ChatGPT, Midjourney) |
| great | TEXT | NOT NULL | AI 도구의 주요 장점 설명 |

### Sample Data

```sql
INSERT INTO agents (name, great) VALUES
  ('ChatGPT', '범용 AI 비서. 글쓰기, 코딩, 분석, 번역, 학습, 이미지 생성 등 전반적인 업무에 강점이 있다.'),
  ('Claude', '긴 문서 분석과 요약에 강하며 자연스러운 글쓰기 품질이 우수하다.'),
  ('Midjourney', '예술적 이미지와 고품질 컨셉 아트 생성에 매우 강하다.');
```

전체 40개 seed 데이터는 `ai.json`에 정의되어 있으며, 서버 시작 시 `seedDB()` 함수가 자동으로 upsert한다.

---

## Row Level Security

Supabase anon key를 사용하므로 RLS 정책이 필요하다.

```sql
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all"
ON agents
FOR ALL
USING (true)
WITH CHECK (true);
```

> **주의**: 이 정책은 모든 사용자(인증되지 않은 사용자 포함)에게 모든 CRUD 작업을 허용한다. 프로덕션 환경에서는 필요에 따라 읽기 전용 정책으로 변경하는 것을 고려해야 한다.

---

## Connection

### Client (Supabase)

환경변수를 통해 연결:

```js
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WebSocket }
});
```

### Direct PostgreSQL Connection

Supabase Dashboard → Project Settings → Database에서 연결 정보 확인 가능 (Connection string, Host, Port, Database, User, Password).

---

## CRUD Operations

`db/db.js`에서 제공하는 함수:

| Function | Description | SQL Equivalent |
|----------|-------------|---------------|
| `getAllAgents()` | 전체 도구 목록 조회 | `SELECT * FROM agents` |
| `addAgent(name, great)` | 도구 등록/수정 | `UPSERT ... ON CONFLICT (name)` |
| `deleteAgent(name)` | 도구 삭제 | `DELETE FROM agents WHERE name = $1` |
| `seedDB()` | 초기 데이터 시딩 | ai.json → upsert (테이블이 비었을 때만) |
