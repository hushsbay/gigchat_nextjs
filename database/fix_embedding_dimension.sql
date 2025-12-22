-- ============================================
-- jobs 테이블의 embedding 컬럼 차원 변경
-- 768 → 1536 (text-embedding-3-small)
-- ============================================

-- 1. 현재 상태 확인
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_name = 'jobs' 
  AND column_name IN ('embedding', 'embedding_ko');

-- 2. 기존 embedding 컬럼 삭제 (데이터 백업 필요시 주석 해제)
-- SELECT id, title, embedding INTO jobs_embedding_backup FROM jobs WHERE embedding IS NOT NULL;

-- 3. embedding 컬럼 제거
ALTER TABLE jobs DROP COLUMN IF EXISTS embedding;

-- 4. 새로운 embedding 컬럼 추가 (1536 차원)
ALTER TABLE jobs ADD COLUMN embedding vector(1536);

-- 5. embedding_ko도 같이 수정 (한국어 임베딩용)
ALTER TABLE jobs DROP COLUMN IF EXISTS embedding_ko;
ALTER TABLE jobs ADD COLUMN embedding_ko vector(1536);

-- 6. 인덱스 생성 (벡터 검색 성능 향상)
CREATE INDEX IF NOT EXISTS jobs_embedding_idx 
ON jobs USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS jobs_embedding_ko_idx 
ON jobs USING ivfflat (embedding_ko vector_cosine_ops)
WITH (lists = 100);

-- 7. 결과 확인
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_name = 'jobs' 
  AND column_name IN ('embedding', 'embedding_ko');

-- 8. 통계 확인
SELECT 
    COUNT(*) as total_jobs,
    COUNT(embedding) as with_embedding,
    COUNT(*) - COUNT(embedding) as without_embedding
FROM jobs;
