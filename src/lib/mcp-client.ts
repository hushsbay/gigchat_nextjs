import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
let openaiClient: OpenAI | null = null

export function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// 텍스트를 OpenAI embedding으로 변환
export async function getEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient()
  
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('OpenAI embedding error:', error)
    throw error
  }
}

// Qwen 모델을 사용한 채팅 완성
export async function chatWithQwen(
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
): Promise<string> {
  const client = getOpenAIClient()
  
  try {
    // OpenAI API 호환 모드로 Qwen 사용
    // 실제 Qwen API 엔드포인트가 있다면 baseURL을 변경해야 합니다
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', //'gpt-3.5-turbo'
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    })
    
    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Chat completion error:', error)
    throw error
  }
}

// MCP 초기화 테스트
export async function testMCPConnection(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // OpenAI API 연결 테스트
    const client = getOpenAIClient()
    
    // 간단한 embedding 테스트
    const testText = '테스트 메시지'
    const embedding = await getEmbedding(testText)
    
    return {
      success: true,
      message: 'MCP 연결 성공',
      details: {
        embeddingDimension: embedding.length,
        apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'MCP 연결 실패',
      details: error instanceof Error ? error.message : String(error)
    }
  }
}
