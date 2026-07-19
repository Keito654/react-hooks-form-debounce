---
name: verify
description: このリポジトリのデバウンス PoC フォームをブラウザで動作検証する手順
---

# 動作検証手順

## 起動

```bash
pnpm dev --port 5199 --strictPort   # バックグラウンドで起動
playwright-cli open http://localhost:5199
```

## 検証フロー(デバウンス発火トリガー)

textbox の ref: e9=質問のきっかけ, e12=質問内容, e15=質問分野や種別, e16=送信ボタン(snapshot で要確認)。

1. 3 フィールドすべて `playwright-cli fill` で入力 → 2.5 秒待つ → `playwright-cli find "発火履歴"` で履歴 1 件を確認
2. フィールド変更後 2 秒以内に別フィールドを空にする → 2.5 秒待っても履歴が増えないこと(キャンセル)
3. 入力を 2 秒未満の間隔で続ける → その間発火せず、静止 2 秒後に最新値で 1 件発火(タイマーリセット)
4. フィールド変更後 2 秒以内に送信ボタンをクリック → submitted JSON が表示され、履歴は増えないこと(送信時キャンセル)

## 注意

- `pnpm lint` が rtk 経由だと "terminated abnormally" になることがある。`rtk proxy npx oxlint src` で直接実行すると正しい結果が得られる
- `pnpm install` は TTY なしだと失敗することがある → `CI=true pnpm install`
- 待機は `python3 -c "import time; time.sleep(2.5)"` を使う(sleep コマンドはブロックされる)
