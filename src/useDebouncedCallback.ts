import { useEffect, useMemo, useRef } from 'react'

export type DebouncedCallback<Args extends unknown[]> = {
  (...args: Args): void
  cancel: () => void
}

/**
 * use-debounce の useDebouncedCallback の自前実装(本プロジェクトで使う範囲のみ)。
 * - 呼び出しごとにタイマーをリセットし、静止 waitMs 後に最後の引数で callback を実行する
 * - cancel() で保留中の発火を破棄する
 * - 返り値はレンダー間で参照が安定し、発火時は常に最新の callback を呼ぶ
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  waitMs: number,
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  return useMemo(() => {
    const debounced = (...args: Args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined
        callbackRef.current(...args)
      }, waitMs)
    }
    debounced.cancel = () => {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    return debounced
  }, [waitMs])
}
