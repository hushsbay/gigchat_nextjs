-- pgvector 확장 설치 및 확인

-- 1. pgvector 확장 설치 (관리자 권한 필요)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 설치 확인
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. jobs 테이블의 embedding 컬럼 타입 확인
SELECT 
    column_name, 
    data_type, 
    udt_name,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name IN ('embedding', 'embedding_ko');

-- 4. embedding 컬럼이 vector 타입이 아니면 변경
-- ALTER TABLE jobs ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector;
-- ALTER TABLE jobs ALTER COLUMN embedding_ko TYPE vector(1536) USING embedding_ko::vector;

-- 5. 인덱스 생성 (성능 향상)
-- CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON jobs USING ivfflat (embedding vector_cosine_ops);
-- CREATE INDEX IF NOT EXISTS jobs_embedding_ko_idx ON jobs USING ivfflat (embedding_ko vector_cosine_ops);
