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
