# SearchAI 기획 문서

## 프로젝트 개요

SearchAI는 사용자가 원하는 작업을 입력하면, 등록된 40여 개의 AI 도구 중 가장 적합한 도구를 Groq AI가 추천해주는 서비스다. 채팅 인터페이스와 카드 기반 탐색 뷰 두 가지 방식으로 결과를 제공한다.

## 핵심 기능

### 1. 채팅 기반 추천 (`/`)

- 사용자가 자연어로 작업을 입력 (예: "이미지 생성하고 싶어요")
- AI가 DB에 등록된 AI 도구별 장점과 사용자의 요청을 분석하여 최적 도구 추천
- SSE 스트리밍으로 실시간 응답 표시, 완료 후 카드 UI로 전환
- 채팅 내역 로컬스토리지 저장 및 초기화 기능
- 사이드바에 등록된 전체 AI 도구 목록 표시

### 2. 탐색 뷰 (`/second`)

- 카드 기반 UI로 추천 결과를 깔끔하게 표시
- 검색 기록 저장 및 시간순 정렬 (방금 전 / N분 전 / N시간 전)
- 히스토리 사이드바에서 이전 결과 클릭하여 다시 보기
- **페르소나 설정**: 직업, 나이, 관심 분야를 입력하면 AI가 사용자 프로필에 맞춰 맞춤형 추천 제공
- 빈 상태의 웰컴 UI 제공

### 3. 관리자 페이지 (`/admin`)

- 비밀번호 인증 기반 관리자 로그인 (Bearer 토큰)
- AI 도구 추가 (이름 + 장점)
- AI 도구 삭제 (확인 다이얼로그)
- 세션 유지 (로컬스토리지 토큰 저장)
- 로그아웃 기능

## AI 추천 시스템

### System Prompt 구조

1. 사용자의 질문(query) 분석
2. DB에 저장된 모든 AI 도구 목록(name + great)을 system prompt에 포함
3. 페르소나가 입력된 경우, 사용자 프로필 정보를 추가 컨텍스트로 제공
4. Groq AI(llama-3.3-70b-versatile)가 JSON 형식으로 응답:
   - `name`: 추천하는 AI 도구 이름
   - `reason`: 추천 이유
   - `tip`: 사용 팁

### 스트리밍 vs 비스트리밍

| 구분 | 비스트리밍 | 스트리밍 |
|------|-----------|---------|
| 엔드포인트 | `POST /api/v1/search` | `POST /api/v1/search/stream` |
| 응답 방식 | JSON 일괄 응답 | SSE (text/event-stream) |
| Groq 옵션 | `response_format: json_object` | `stream: true` |
| 특징 | response_format으로 정형화된 JSON 보장 | 실시간 토큰 출력, 완료 후 result 이벤트 |

> 참고: Groq SDK에서 `stream: true`와 `response_format: json_object`는 동시에 사용 불가

### AI 도구 데이터 (40개)

`ai.json`에 정의된 AI 도구는 다음 9개 카테고리로 분류됨:

| 카테고리 | 도구 |
|---------|------|
| 범용 AI 비서 | ChatGPT, Claude, Gemini, Microsoft Copilot |
| AI 검색 | Perplexity, Grok |
| AI 코딩 | Cursor, GitHub Copilot, Codeium, Windsurf, Tabnine, Replit AI |
| 이미지 생성 | Midjourney, DALL-E, Stable Diffusion, Adobe Firefly, Flux, Ideogram, Leonardo AI, Canva AI |
| 영상 생성 | Runway, Google Veo, Pika, Luma Dream Machine, Synthesia |
| 음성/AI 아바타 | ElevenLabs, Murf AI, PlayHT |
| 음악 생성 | Suno, Udio |
| 문서/마케팅 | Notion AI, Jasper, Copy.ai, Grammarly, Otter.ai, DeepL, NotebookLM |
| 업무 자동화 | n8n AI, Zapier AI, Make |

## 기술적 결정 사항

- **Express 5**: Express 5의 wildcard 라우트는 `'/{*path}'` 문법 사용 (Express 4의 `'*'`와 다름)
- **Supabase RLS**: anon key로 접근하므로 Row Level Security로 `agents` 테이블 전체 접근 허용
- **프론트엔드 상태 관리**: 별도 라이브러리 없이 로컬스토리지로 채팅/히스토리/인증 상태 관리
- **프론트엔드 라우팅**: Express static serving + SPA fallback으로 처리 (별도 라우터 불필요)

## 향후 개선 사항

- 카테고리별 AI 도구 필터링
- 추천 결과에 대한 피드백 (좋아요/싫어요)
- AI 도구 상세 페이지 (링크, 가격 정보 등)
- 사용자 계정 시스템 도입 (DB 기반 인증)
- 채팅방/세션 분리
- docker-compose로 전체 인프라 구성
