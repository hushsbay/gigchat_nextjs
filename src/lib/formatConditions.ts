/**
 * 일자리 조건 formatting 유틸리티
 * 채팅 메시지와 조건 카드에서 동일한 형식으로 표시하기 위한 공통 함수
 */

export function formatAge(age: string | number | null): string | null {
  if (!age) return null
  // 숫자든 문자열이든 그대로 반환 (세 붙이지 않음)
  return typeof age === 'number' ? age.toString() : age
}

export function formatWage(wage: string | number | null): string | null {
  if (!wage) return null
  
  if (typeof wage === 'string') {
    // "20000 이상" → "20,000원 이상" 형식으로 변환
    const match = wage.match(/^(\d+)\s*(.*)$/)
    if (match) {
      const [, amount, condition] = match
      // 조건이 있으면 "숫자원 조건" 형식, 없으면 "숫자원"
      if (condition.trim()) {
        return `${Number(amount).toLocaleString()}원 ${condition.trim()}`
      } else {
        return `${Number(amount).toLocaleString()}원`
      }
    } else {
      return wage
    }
  } else {
    return wage.toLocaleString() + '원'
  }
}
