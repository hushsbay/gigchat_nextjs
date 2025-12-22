'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // ✅ 전역 Query 에러 로깅 (함수명/쿼리키 포함)
        console.error('[TanStack Query Error]', {
          queryKey: query.queryKey,        // ['chatHistory', 'infinite']
          queryHash: query.queryHash,      // 고유 해시
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
        
        // TODO: 프로덕션 환경에서는 Sentry로 전송
        // Sentry.captureException(error, {
        //   tags: {
        //     queryKey: JSON.stringify(query.queryKey),
        //     component: 'TanStackQuery'
        //   }
        // })
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // ✅ 전역 Mutation 에러 로깅
        console.error('[TanStack Mutation Error]', {
          mutationKey: mutation.options.mutationKey, // ['saveChatMessage']
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // 네트워크 에러는 3번까지 재시도
          if (error instanceof Error && error.message.includes('fetch')) {
            return failureCount < 3
          }
          // 그 외 에러는 재시도 안 함
          return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // 지수 백오프
      },
      mutations: {
        retry: 1, // Mutation은 1번만 재시도
      }
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
