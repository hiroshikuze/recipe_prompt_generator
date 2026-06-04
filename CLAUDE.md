# Recipe Prompt Generator

## プロジェクト概要

AIに料理レシピを生成させるためのプロンプトを提案するWebツール。

## プロジェクト構成

```
/
├── index.html          # 日本語版メインページ
├── en/index.html       # 英語版ページ
├── main.js             # アプリケーションロジック全体
├── style.css           # スタイルシート
├── locales/
│   ├── ja.json         # 日本語テキスト（i18n）
│   └── en.json         # 英語テキスト（i18n）
├── images/
│   ├── RecipePromptGenerator.png  # OGP画像
│   └── favicon_w256.png           # ファビコン元画像
├── favicon.ico         # ファビコン
├── apple-touch-icon.png
├── robots.txt
├── sitemap.xml
└── README.md
```

## 規約ファイル

`.claude/rules/` に規約を分割管理:

- `coding.md` — JS・i18n・インデント等のコーディング規約
- `git.md` — コミット・ブランチ・破壊的操作の規約
- `readme.md` — README記述規約
- `versioning.md` — 静的リソースのバージョン管理規約

## 保留中のタスク

### 紹介動画（YouTube）

約30秒の構成案（ユーザーが撮影・編集予定）:

1. **0〜5秒**: 課題提示「AIにレシピを頼みたいけどうまく伝えられない」
2. **5〜15秒**: 操作デモ（機材チェック→材料入力→プロンプト生成の画面録画）
3. **15〜22秒**: 生成プロンプトをPerplexityに貼り付けてレシピが出る結果
4. **22〜30秒**: CTA（無料・登録不要・日英対応・URL表示）

動画完成後にやること（YouTubeのURLが決まったら実装）:
- `README.md` のFeaturesセクション付近にYouTubeバッジを追加（デモバッジと並べる）
- `index.html` のフッターかWhat's Newモーダル内にリンクボタンを追加
