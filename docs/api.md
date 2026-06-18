# SearchAI API 명세

Base URL: `http://localhost:3000`

---

## GET /api/agents

등록된 모든 AI 도구 목록을 조회한다.

### Response `200 OK`

```json
[
  {
    "name": "ChatGPT",
    "great": "범용 AI 비서. 글쓰기, 코딩, 분석, 번역, 학습, 이미지 생성 등 전반적인 업무에 강점이 있다."
  },
  {
    "name": "Claude",
    "great": "긴 문서 분석과 요약에 강하며 자연스러운 글쓰기 품질이 우수하다."
  }
]
```

### Response `500 Internal Server Error`

```json
{ "error": "Internal server error" }
```

---

## POST /api/v1/search

AI 도구를 추천받는다 (비스트리밍). Groq의 `response_format: json_object`를 사용하여 정형화된 JSON을 응답받는다.

### Request

```json
{
  "query": "이미지 생성하고 싶어요",
  "persona": "직업: 대학생, 나이: 22, 관심 분야: 디자인"  // 선택
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Y | 사용자가 원하는 작업 설명 |
| persona | string | N | 사용자 프로필 정보 (직업, 나이, 관심 분야 등) |

### Response `200 OK`

```json
{
  "name": "Midjourney",
  "reason": "예술적인 이미지 생성에 가장 강력한 도구로, 사용자의 요청에 맞춰 고품질의 이미지를 생성할 수 있습니다.",
  "tip": "프롬프트에 '--ar 16:9'를 추가하면 와이드스크린 비율의 이미지를 얻을 수 있습니다."
}
```

### Response `400 Bad Request`

```json
{ "error": "query is required" }
```

### Response `500 Internal Server Error`

```json
{ "error": "Internal server error" }
```

---

## POST /api/v1/search/stream

AI 도구를 SSE(Server-Sent Events) 스트리밍으로 추천받는다. Groq의 `stream: true` 옵션을 사용하여 토큰 단위로 실시간 수신 후 클라이언트에 포워딩한다.

- `response_format: json_object`와 호환되지 않으므로 system prompt에 JSON 형식을 명시적으로 지정
- 스트리밍 중 오류 발생 시 `type: error` 이벤트 전송

### Request

```json
{
  "query": "이미지 생성하고 싶어요",
  "persona": "직업: 대학생, 나이: 22, 관심 분야: 디자인"  // 선택
}
```

### SSE Events

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"token","content":"{"}
data: {"type":"token","content":"\\n  \"name\": \"Mi"}
data: {"type":"token","content":"djourney\", ..."}
data: {"type":"result","result":{"name":"Midjourney","reason":"...","tip":"..."}}
data: [DONE]
```

| Event type | Fields | Description |
|------------|--------|-------------|
| token | `type: "token"`, `content: string` | AI 응답의 실시간 텍스트 조각 |
| result | `type: "result"`, `result: object` | 최종 파싱된 JSON 결과 (name, reason, tip) |
| error | `type: "error"`, `message: string` | JSON 파싱 실패 또는 서버 오류 |
| [DONE] | - | 스트림 종료 신호 |

### Flow

1. 클라이언트가 SSE 연결을 열고 POST 요청 전송
2. 서버가 Groq API로부터 토큰을 수신하는 즉시 `type: token` 이벤트로 포워딩
3. 모든 토큰 수집 후 `JSON.parse` 시도
4. 성공 시 `type: result` 이벤트로 완성된 JSON 전송
5. 실패 시 `type: error` 이벤트 전송
6. `[DONE]` 신호로 스트림 종료
7. 프론트엔드는 token을 실시간 표시하다가 result 수신 시 카드 UI로 교체

---

## POST /api/v1/admin/verify

관리자 비밀번호를 검증한다. 성공 시 클라이언트는 해당 비밀번호를 Bearer 토큰으로 저장하여 이후 요청에 사용한다.

### Request

```json
{
  "password": "admin1234"
}
```

### Response `200 OK`

```json
{ "success": true }
```

### Response `401 Unauthorized`

```json
{ "error": "Invalid password" }
```

---

## POST /api/v1/admin/ai

새로운 AI 도구를 등록한다. (관리자 인증 필요)

### Headers

```
Authorization: Bearer <admin-password>
```

### Request

```json
{
  "name": "NewAI",
  "great": "이 도구의 장점을 설명합니다."
}
```

### Response `201 Created`

```json
{ "message": "AI tool added" }
```

### Response `400 Bad Request`

```json
{ "error": "name and great are required" }
```

### Response `401 Unauthorized`

```json
{ "error": "Unauthorized" }
```

---

## DELETE /api/v1/admin/ai/:name

AI 도구를 삭제한다. (관리자 인증 필요)

### Headers

```
Authorization: Bearer <admin-password>
```

### Response `200 OK`

```json
{ "message": "AI tool deleted" }
```

### Response `401 Unauthorized`

```json
{ "error": "Unauthorized" }
```

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (필수 파라미터 누락 등) |
| 401 | 인증 실패 (관리자 전용 엔드포인트) |
| 500 | 서버 내부 오류 |

---

## Static Routes

| Path | File |
|------|------|
| `/` | `public/index.html` |
| `/second` | `public/second.html` |
| `/admin` | `public/admin.html` |
| `/{*path}` | `public/index.html` (SPA fallback) |
