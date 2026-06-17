-- Gokaist agents 테이블 생성
CREATE TABLE agents (
    name TEXT PRIMARY KEY,
    great TEXT NOT NULL
);

-- RLS 활성화
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 정책 (anon key 접근용)
CREATE POLICY "anon_all"
    ON agents
    FOR ALL
    USING (true)
    WITH CHECK (true);
