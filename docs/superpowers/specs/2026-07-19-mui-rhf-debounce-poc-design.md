# MUI × react-hook-form × debounce PoC — フォーム作成 設計書

日付: 2026-07-19
ステータス: 承認済み

## 目的

MUI の TextField と react-hook-form(以下 RHF)を組み合わせ、debounce 処理が実現できるかを検証する PoC ページの土台を作る。本設計のスコープは「Controller 形式の入力フォーム3つを持つページの作成」まで。debounce 自体の設計・実装は後続タスク(現時点で対象は未定)。

デモ用途であり、セキュリティや完璧さは要求されない。テストは書かない。

## 前提・制約

- 既存リポジトリ: Vite + React 19 + TypeScript(初期テンプレート状態)
- パッケージマネージャ: pnpm
- RHF 公式ガイド [Integrating with UI libraries](https://react-hook-form.com/get-started#IntegratingwithUIlibraries) に従い、`useForm` + `Controller` 形式で実装する
- フォーム構成: useForm は1つ、その中に入力欄3つ + 送信ボタン1つ

## 設計

### 依存追加

```
pnpm add react-hook-form @mui/material @emotion/react @emotion/styled
```

### コンポーネント構成

- `src/PocForm.tsx`(新規)
  - `useForm<FormValues>` — フィールドは `name` / `email` / `comment`、`defaultValues` はすべて空文字
  - 各フィールドを `<Controller render={({ field }) => <TextField {...field} />} />` で個別に3つ記述(公式ガイドの形を維持。ループやラッパー化はしない — 後続の debounce 検証でフィールドごとに異なる戦略を試せるようにするため)
  - バリデーションは `required` 程度の軽いもの。エラーは TextField の `error` / `helperText` に表示
  - `handleSubmit` で送信し、送信値をフォーム下に JSON 表示(debounce 検証時の動作確認用)
- `src/App.tsx`(置き換え)
  - 既存テンプレートのデモ UI を削除し、タイトルと `<PocForm />` を表示するだけにする
  - 不要になった `App.css` の記述や未使用アセットの import は削除

### 検証方法

`pnpm dev` でページを表示し、以下を目視確認:

1. TextField 3つと送信ボタンが表示される
2. 未入力で送信するとエラーメッセージが TextField 下に出る
3. 3欄に入力して送信すると入力値が JSON で表示される

## 採用しなかった案

- **ラッパーコンポーネント方式**: Controller + TextField を共通化して3回使う案。コードは短くなるが、公式ガイドの形から離れ、フィールドごとに debounce 戦略を変える実験がしづらいため不採用。
- **独立した3フォーム(useForm×3)**: ユーザー確認の結果、「1フォームに3入力欄」が意図であるため不採用。
