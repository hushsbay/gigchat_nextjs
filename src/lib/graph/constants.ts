export const CATEGORIES = [
  '서빙',
  '주방',
  '배달',
  '편의점',
  '카페',
  '사무',
  '청소',
  '경비',
  '포장',
  '제조',
  '판매',
  '상담',
  '교육',
  '기타',
] as const

export type Category = typeof CATEGORIES[number]

export const SEARCH_KEYWORDS = [
  '찾아줘',
  '찾아',
  '검색',
  '알려줘',
  '추천',
  '보여줘',
  '구해줘',
  '있어?',
]

export const JOB_KEYWORDS = [
  '일자리',
  '아르바이트',
  '알바',
  '구인',
  '채용',
  '직업',
  '근무',
  '시급',
  '월급',
]
