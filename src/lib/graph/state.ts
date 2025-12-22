import { z } from 'zod'

// 조건 스키마
export const ConditionSchema = z.object({
  gender: z.string().nullable().default(null),
  age: z.union([z.number(), z.string()]).nullable().default(null),
  place: z.string().nullable().default(null),
  work_days: z.string().nullable().default(null),
  start_time: z.string().nullable().default(null),
  end_time: z.string().nullable().default(null),
  hourly_wage: z.union([z.number(), z.string()]).nullable().default(null),
  requirements: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
})

export type Condition = z.infer<typeof ConditionSchema>

// 기본 조건값
export const DEFAULT_CONDITION: Condition = {
  gender: null,
  age: null,
  place: null,
  work_days: null,
  start_time: null,
  end_time: null,
  hourly_wage: null,
  requirements: null,
  category: null,
}

// ChatState 타입 정의 (langgraph 제거)
export interface ChatState {
  user_id: string | null
  text: string
  condition: Condition
  search: boolean
  searchInResults: boolean
  jobseekerId: number | null
  similarityThreshold: number
  is_job_related: boolean | null
  response: string | null
  result: any[]
}
