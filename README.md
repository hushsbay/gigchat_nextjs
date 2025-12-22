# gigchat_nextjs

Next.js 기반의 AI 챗봇 프로젝트입니다.

## 기술 스택

- Next.js 15.0.3 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Lucide React (아이콘)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 3. 프로덕션 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
gigchat_nextjs/
├── src/
│   ├── app/              # App Router 페이지
│   │   ├── layout.tsx    # 루트 레이아웃
│   │   └── page.tsx      # 메인 페이지
│   └── components/       # 재사용 가능한 컴포넌트
├── public/              # 정적 파일
└── ...설정 파일들
```

## 개발 가이드

- `src/app/` 디렉터리에서 페이지를 추가/수정합니다.
- `src/components/` 디렉터리에서 재사용 가능한 컴포넌트를 관리합니다.
- Import alias `@/*`를 사용하여 절대 경로로 import 가능합니다.

## 라이센스

MIT
