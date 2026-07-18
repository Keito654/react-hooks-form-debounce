# MUI × react-hook-form PoC フォーム Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MUI TextField + react-hook-form の Controller で作った入力欄3つを持つ PoC ページを作る(debounce 検証の土台)。

**Architecture:** 単一ページ構成。`src/PocForm.tsx` に `useForm` 1つと `Controller` + `TextField` を3つ直接記述し、`src/App.tsx` はそれを表示するだけに置き換える。RHF 公式ガイド「Integrating with UI libraries」の形を維持する。

**Tech Stack:** Vite 8 / React 19 / TypeScript / react-hook-form v7 / @mui/material (+ @emotion/react, @emotion/styled)

## Global Constraints

- デモ用途。自動テストは書かない(spec で明示)。検証は `pnpm build`・`pnpm lint`・`pnpm dev` での目視。
- パッケージマネージャは pnpm。
- Controller はループやラッパー化をせず、3つ個別に記述する(後続の debounce 検証でフィールドごとに戦略を変えられるようにするため)。
- フィールドは `name` / `email` / `comment` の3つ。defaultValues はすべて空文字。バリデーションは `required` のみ。

---

### Task 1: 依存パッケージの追加

**Files:**
- Modify: `package.json`(pnpm コマンド経由。手編集しない)

**Interfaces:**
- Produces: `react-hook-form`, `@mui/material`, `@emotion/react`, `@emotion/styled` が import 可能になる

- [ ] **Step 1: パッケージを追加**

```bash
pnpm add react-hook-form @mui/material @emotion/react @emotion/styled
```

Expected: `dependencies` に4パッケージが追加され、エラーなく完了する。

- [ ] **Step 2: ビルドが壊れていないことを確認**

Run: `pnpm build`
Expected: `tsc -b && vite build` が成功する(exit code 0)。

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: react-hook-form と MUI を追加"
```

---

### Task 2: PocForm コンポーネントの作成

**Files:**
- Create: `src/PocForm.tsx`

**Interfaces:**
- Consumes: Task 1 で追加したパッケージ
- Produces: `export default function PocForm(): JSX.Element` — props なし。Task 3 で `import PocForm from './PocForm'` として使う

- [ ] **Step 1: PocForm.tsx を作成**

`src/PocForm.tsx` を以下の内容で新規作成する:

```tsx
import { useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Box, Button, Stack, TextField } from '@mui/material'

type FormValues = {
  name: string
  email: string
  comment: string
}

export default function PocForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', email: '', comment: '' },
  })
  const [submitted, setSubmitted] = useState<FormValues | null>(null)

  const onSubmit: SubmitHandler<FormValues> = (data) => setSubmitted(data)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Controller
          name="name"
          control={control}
          rules={{ required: '名前は必須です' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="名前"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          rules={{ required: 'メールアドレスは必須です' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="メールアドレス"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="comment"
          control={control}
          rules={{ required: 'コメントは必須です' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="コメント"
              multiline
              minRows={3}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Button type="submit" variant="contained">
          送信
        </Button>
        {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 2: 型チェックと lint を通す**

Run: `pnpm build && pnpm lint`
Expected: 両方とも成功する(exit code 0)。この時点では PocForm はどこからも import されていないが、それで問題ない。

- [ ] **Step 3: Commit**

```bash
git add src/PocForm.tsx
git commit -m "feat: Controller + MUI TextField のフォーム3欄を持つ PocForm を追加"
```

---

### Task 3: App.tsx を PoC ページに置き換え

**Files:**
- Modify: `src/App.tsx`(全面置き換え)
- Delete: `src/App.css`(旧テンプレート専用のスタイル。新 App では未使用になる)

**Interfaces:**
- Consumes: Task 2 の `PocForm`(default export, props なし)

- [ ] **Step 1: App.tsx を全面的に書き換え**

`src/App.tsx` の内容を以下で置き換える(旧テンプレートの hero 画像・カウンター・リンク集はすべて削除):

```tsx
import PocForm from './PocForm'

function App() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>MUI × react-hook-form × debounce PoC</h1>
      <PocForm />
    </main>
  )
}

export default App
```

- [ ] **Step 2: 未使用になった App.css を削除**

```bash
rm src/App.css
```

注意: `src/index.css` と `src/assets/` は残す(index.css は main.tsx から参照されている。assets は未使用になるがデモ用途のため掃除は不要)。

- [ ] **Step 3: ビルドと lint を確認**

Run: `pnpm build && pnpm lint`
Expected: 両方とも成功する(exit code 0)。

- [ ] **Step 4: dev サーバーで目視確認**

Run: `pnpm dev` を起動し、ブラウザで表示されたURL(通常 http://localhost:5173)を開く。

確認項目(spec の検証方法):
1. TextField 3つ(名前・メールアドレス・コメント)と送信ボタンが表示される
2. 未入力のまま送信すると、各 TextField の下に「〜は必須です」のエラーメッセージが赤字で出る
3. 3欄に入力して送信すると、入力値が JSON でフォーム下に表示される

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git rm src/App.css
git commit -m "feat: App を PoC フォームページに置き換え"
```
