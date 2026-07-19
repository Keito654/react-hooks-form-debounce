# デバウンス発火トリガー Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3つのフォームフィールドがすべて埋まったら発火し、以後更新のたびに 2000ms デバウンスされて発火するイベントハンドラを実装する(FAQ 提案 AI 呼び出しタイミングの PoC)。

**Architecture:** RHF の `subscribe` API(再レンダーなしの全フィールド購読)で値変更を監視し、use-debounce の `useDebouncedCallback` で発火を制御するカスタムフック `useFaqSuggestionTrigger` を新設。`PocForm` はフックに `subscribe` と発火時コールバックを渡し、発火履歴を画面に表示する。Controller / TextField には手を入れないため、入力のデバウンス禁止・submit は生値という制約が構造的に満たされる。

**Tech Stack:** Vite 8 / React 19 / TypeScript / react-hook-form v7.82(`subscribe` API)/ use-debounce v10 / @mui/material

## Global Constraints

- デモ用途。自動テストは書かない(spec で明示)。検証は `pnpm build`・`pnpm lint`・`pnpm dev` での目視。
- デバウンスライブラリは use-debounce のみ使用する(追加パッケージ導入禁止。依存はすべて導入済み)。
- ユーザーの文字入力はデバウンスしてはならない(RHF の状態更新・画面反映は即時のまま)。
- submit はデバウンスされた値ではなく、その時点の入力値で行う。submit 時に保留中のデバウンスはキャンセルする。
- デバウンス待機時間は 2000ms。定数 `DEBOUNCE_WAIT_MS` として定義する。
- 空欄判定は `trim()` 後の空文字比較(空白のみは未入力扱い)。1つでも空ならデバウンスをキャンセルし、発火を停止する。
- 初回発火(3つ目が埋まった瞬間)もデバウンス経由(leading 発火なし)。
- パッケージマネージャは pnpm。

---

### Task 1: useFaqSuggestionTrigger フックの作成

**Files:**
- Modify: `src/PocForm.tsx:5`(`type FormValues` に `export` を付けるのみ)
- Create: `src/useFaqSuggestionTrigger.ts`

**Interfaces:**
- Consumes: `react-hook-form` の `UseFormSubscribe` 型、`use-debounce` の `useDebouncedCallback`、`src/PocForm.tsx` の `FormValues` 型(`trigger` / `question` / `category`、すべて string)
- Produces: `useFaqSuggestionTrigger(subscribe: UseFormSubscribe<FormValues>, onFire: (values: FormValues) => void): { cancel: () => void }` — Task 2 で `import { useFaqSuggestionTrigger } from './useFaqSuggestionTrigger'` として使う。`export const DEBOUNCE_WAIT_MS = 2000` も公開する

- [ ] **Step 1: PocForm.tsx の FormValues 型を export する**

`src/PocForm.tsx` の型定義行を変更する(これだけ。他は触らない):

```tsx
// 変更前
type FormValues = {

// 変更後
export type FormValues = {
```

- [ ] **Step 2: useFaqSuggestionTrigger.ts を作成**

`src/useFaqSuggestionTrigger.ts` を以下の内容で新規作成する:

```ts
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
```

補足(実装者向け):
- `useDebouncedCallback` の戻り値は再レンダー間で同一参照であり、最新の `onFire` を内部 ref で保持するため、`onFire` に inline 関数を渡しても問題ない。
- `PocForm.tsx` → `useFaqSuggestionTrigger.ts` → `PocForm.tsx` の循環は型 import のみなのでコンパイル時に消え、問題ない。

- [ ] **Step 3: 型チェックと lint を通す**

Run: `pnpm build && pnpm lint`
Expected: 両方とも成功する(exit code 0)。この時点ではフックはどこからも import されていないが、それで問題ない。

- [ ] **Step 4: Commit**

```bash
git add src/PocForm.tsx src/useFaqSuggestionTrigger.ts
git commit -m "feat: 全フィールド入力時にデバウンス発火する useFaqSuggestionTrigger を追加"
```

---

### Task 2: PocForm への組み込みと発火履歴表示

**Files:**
- Modify: `src/PocForm.tsx`(全面置き換え)

**Interfaces:**
- Consumes: Task 1 の `useFaqSuggestionTrigger(subscribe, onFire): { cancel }`

- [ ] **Step 1: PocForm.tsx を全面的に書き換え**

`src/PocForm.tsx` の内容を以下で置き換える(Controller 3つと送信ボタンは既存のまま。変更点は `subscribe` の取り出し・フック接続・発火履歴の state と表示・submit 時の cancel):

```tsx
import { useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useFaqSuggestionTrigger } from './useFaqSuggestionTrigger'

export type FormValues = {
  trigger: string
  question: string
  category: string
}

type FireLogEntry = {
  id: number
  firedAt: string
  values: FormValues
}

export default function PocForm() {
  const { control, handleSubmit, subscribe } = useForm<FormValues>({
    defaultValues: { trigger: '', question: '', category: '' },
  })
  const [submitted, setSubmitted] = useState<FormValues | null>(null)
  const [fireLog, setFireLog] = useState<FireLogEntry[]>([])

  // 将来はここが FAQ 提案 AI の API コールに置き換わる
  const { cancel } = useFaqSuggestionTrigger(subscribe, (values) => {
    setFireLog((prev) => [
      {
        id: prev.length + 1,
        firedAt: new Date().toLocaleTimeString('ja-JP'),
        values,
      },
      ...prev,
    ])
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    cancel()
    setSubmitted(data)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Controller
          name="trigger"
          control={control}
          rules={{ required: '質問のきっかけは必須です' }}
          render={({ field: { ref, ...rest }, fieldState }) => (
            <TextField
              {...rest}
              inputRef={ref}
              label="質問のきっかけ"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="question"
          control={control}
          rules={{ required: '質問内容は必須です' }}
          render={({ field: { ref, ...rest }, fieldState }) => (
            <TextField
              {...rest}
              inputRef={ref}
              label="質問内容"
              multiline
              minRows={3}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          rules={{ required: '質問分野や種別は必須です' }}
          render={({ field: { ref, ...rest }, fieldState }) => (
            <TextField
              {...rest}
              inputRef={ref}
              label="質問分野や種別"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Button type="submit" variant="contained">
          送信
        </Button>
        {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
        {fireLog.length > 0 && (
          <Box>
            <Typography variant="subtitle2">
              デバウンス発火履歴(新しい順)
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {fireLog.map((entry) => (
                <li key={entry.id}>
                  {entry.firedAt} — {JSON.stringify(entry.values)}
                </li>
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 2: 型チェックと lint を通す**

Run: `pnpm build && pnpm lint`
Expected: 両方とも成功する(exit code 0)。

- [ ] **Step 3: dev サーバーで目視確認**

Run: `pnpm dev` を起動し、ブラウザで表示された URL(通常 http://localhost:5173)を開く。

確認項目(spec の挙動一覧):
1. 3欄すべてに入力し、入力を止めて約2秒後に「デバウンス発火履歴」に1件追加される(入力途中では追加されない)
2. その後どこかの欄を更新し、静止2秒後に再発火して履歴が増える
3. 連続入力中(静止2秒未満)は発火しない(タイマーが延長される)
4. どれかの欄を空(または空白のみ)にすると、直前の入力から2秒待っても発火しない。再び全欄を埋めて静止すると発火が再開する
5. 入力直後(2秒待たず)に送信ボタンを押すと、入力中の生の値が JSON 表示され、その後2秒待っても保留中だった発火は起きない
6. 文字入力自体は一切遅延なく画面に反映される

- [ ] **Step 4: Commit**

```bash
git add src/PocForm.tsx
git commit -m "feat: PocForm にデバウンス発火トリガーと発火履歴表示を組み込み"
```
