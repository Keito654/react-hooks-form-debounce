import { useEffect } from 'react'
import type { UseFormSubscribe } from 'react-hook-form'
import { useDebouncedCallback } from 'use-debounce'
import type { FormValues } from './PocForm'

export const DEBOUNCE_WAIT_MS = 2000

const isAllFilled = (values: FormValues) =>
  values.trigger.trim() !== '' &&
  values.question.trim() !== '' &&
  values.category.trim() !== ''

/**
 * 全フィールドが埋まっている間だけ、入力静止 DEBOUNCE_WAIT_MS 後に onFire を呼ぶ。
 * 空欄(空白のみ含む)が発生したら保留中の発火をキャンセルする。
 */
export function useFaqSuggestionTrigger(
  subscribe: UseFormSubscribe<FormValues>,
  onFire: (values: FormValues) => void,
) {
  const debounced = useDebouncedCallback(onFire, DEBOUNCE_WAIT_MS)

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        if (isAllFilled(values)) {
          debounced(values)
        } else {
          debounced.cancel()
        }
      },
    })
    return () => {
      unsubscribe()
      debounced.cancel()
    }
  }, [subscribe, debounced])

  return { cancel: debounced.cancel }
}
