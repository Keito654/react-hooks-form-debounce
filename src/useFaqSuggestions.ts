import { skipToken, useQuery } from '@tanstack/react-query'
import type { FormValues } from './PocForm'

export type FaqSuggestion = {
  id: number
  title: string
}

type SearchResponse = {
  posts: FaqSuggestion[]
}

const MAX_SUGGESTIONS = 5

// 本番では全フィールドを使う想定だが、デモ API は単純な文字列検索のため
// 最もヒットしやすい「質問内容」を検索語にする
const fetchFaqSuggestions = async (
  values: FormValues,
  signal: AbortSignal,
): Promise<FaqSuggestion[]> => {
  const url = new URL('https://dummyjson.com/posts/search')
  url.searchParams.set('q', values.question)
  url.searchParams.set('limit', String(MAX_SUGGESTIONS))
  url.searchParams.set('select', 'title')
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`FAQ 検索 API がエラーを返しました (HTTP ${res.status})`)
  }
  const data: SearchResponse = await res.json()
  return data.posts
}

/**
 * デバウンス発火で確定した入力値をもとに FAQ 候補を取得する。
 * values が null の間はクエリを停止する(skipToken)。
 * queryKey に全フィールドを含めるため、同一入力での再発火はキャッシュヒットになる。
 */
export function useFaqSuggestions(values: FormValues | null) {
  return useQuery({
    queryKey: ['faqSuggestions', values],
    queryFn: values
      ? ({ signal }) => fetchFaqSuggestions(values, signal)
      : skipToken,
    staleTime: 5 * 60 * 1000,
  })
}
