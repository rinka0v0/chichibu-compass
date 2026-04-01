# ディレクトリ構造設計書

## 概要

このドキュメントは、プロジェクトのディレクトリ構造と各ディレクトリの役割を定義します。
Expo Router を使用したファイルベースルーティング構成です。

## 全体構造

```
temple-map-mobile/
├── .claude/                    # Claude Code 用設計ドキュメント
│   ├── 00_project/
│   ├── 01_architecture/
│   ├── 02_directory/
│   ├── 03_components/
│   ├── 04_design/
│   ├── 05_data/
│   └── 06_libraries/
├── app/                        # Expo Router スクリーン
│   ├── _layout.tsx             # ルートレイアウト
│   ├── (tabs)/
│   │   ├── _layout.tsx         # タブレイアウト
│   │   ├── index.tsx           # 地図タブ
│   │   ├── temples.tsx         # 札所一覧タブ
│   │   └── progress.tsx        # 進捗タブ
│   ├── temple/
│   │   └── [id].tsx            # 札所詳細画面
│   └── modal.tsx               # モーダル
├── assets/                     # 静的ファイル
│   ├── data/
│   │   └── temples.json        # 札所データ
│   └── images/                 # 画像ファイル
├── components/                 # UIコンポーネント
│   ├── layout/                 # レイアウトコンポーネント
│   ├── map/                    # 地図関連コンポーネント
│   ├── temple/                 # 札所関連コンポーネント
│   └── ui/                     # 汎用UIコンポーネント
├── hooks/                      # カスタムフック
├── lib/                        # ライブラリ・ユーティリティ
│   ├── api/                    # API クライアント
│   ├── storage/                # AsyncStorage 操作
│   └── utils/                  # 汎用ユーティリティ
├── types/                      # TypeScript 型定義
├── constants/                  # 定数定義
├── app.json                    # Expo 設定
├── package.json
├── tsconfig.json               # TypeScript 設定
└── CLAUDE.md                   # プロジェクトガイド
```

## ディレクトリ詳細

### `/assets`

静的ファイルを配置。`require()` でバンドルに含めます。

```
assets/
├── data/
│   └── temples.json          # 34ヶ所の札所データ（JSON）
├── images/
│   ├── icon.png              # アプリアイコン
│   ├── splash-icon.png       # スプラッシュ画像
│   └── temples/              # 札所の写真（必要に応じて）
└── fonts/                    # カスタムフォント（必要に応じて）
```

**役割**:
- 変更されない静的データ・画像の配置
- `require('@/assets/data/temples.json')` でアクセス

### `/app` - Expo Router スクリーン

Expo Router のファイルベースルーティング。

```
app/
├── _layout.tsx               # 全画面共通のルートレイアウト（SafeAreaProvider等）
├── (tabs)/
│   ├── _layout.tsx           # タブナビゲーションの設定
│   ├── index.tsx             # 地図タブ（デフォルト）
│   ├── temples.tsx           # 札所一覧タブ
│   └── progress.tsx          # 進捗タブ
├── temple/
│   └── [id].tsx              # 札所詳細（例: /temple/1）
└── modal.tsx                 # モーダル画面
```

**ルーティング**:
- `/` - 地図表示（メイン画面）
- `/temples` - 札所一覧
- `/temple/[id]` - 札所詳細（例: `/temple/1`）
- `/progress` - 巡礼進捗状況

**ファイル規約**:
- `_layout.tsx` - レイアウト・ナビゲーション設定
- `index.tsx` - タブグループのデフォルト画面
- `[id].tsx` - 動的ルート（パラメータ付き）

### `/components` - UIコンポーネント

再利用可能なUIコンポーネントを配置。

```
components/
├── layout/
│   ├── Header.tsx            # ヘッダー（オプション、タブ内で使用）
│   └── Container.tsx         # コンテナ（パディング管理）
├── map/
│   ├── MapView.tsx           # 地図表示コンポーネント
│   ├── TempleMarker.tsx      # 札所マーカー
│   ├── CurrentLocationMarker.tsx  # 現在位置マーカー
│   └── RoutePolyline.tsx     # 経路表示
├── temple/
│   ├── TempleCard.tsx        # 札所カード
│   ├── TempleList.tsx        # 札所リスト
│   ├── TempleDetail.tsx      # 札所詳細情報
│   └── VisitCheckbox.tsx     # 訪問チェックボックス
└── ui/
    ├── Button.tsx            # ボタン
    ├── Card.tsx              # カード
    ├── Badge.tsx             # バッジ
    ├── Spinner.tsx           # ローディングスピナー
    └── ErrorMessage.tsx      # エラーメッセージ
```

**命名規則**:
- PascalCase で命名
- 1コンポーネント = 1ファイル
- デフォルトエクスポート

**分類基準**:
- `layout/` - 画面レイアウト関連
- `map/` - 地図機能関連
- `temple/` - 札所情報表示関連
- `ui/` - 汎用的なUIパーツ

### `/hooks` - カスタムフック

状態管理とロジックをカプセル化。

```
hooks/
├── useVisitedTemples.ts     # 訪問記録管理
├── useUserLocation.ts       # 現在位置取得（expo-location）
├── useRouting.ts            # 経路検索（OSRM）
├── useTemples.ts            # 札所データ取得
└── useAsyncStorage.ts       # AsyncStorage 汎用フック
```

**命名規則**:
- `use` プレフィックス必須
- camelCase で命名

**責務**:
- 状態管理
- 副作用の管理（API呼び出し、AsyncStorage操作）
- ビジネスロジックのカプセル化

### `/lib` - ライブラリ・ユーティリティ

外部サービス連携やユーティリティ関数。

```
lib/
├── api/
│   └── routing.ts           # OSRM API クライアント
├── storage/
│   ├── visitedTemples.ts    # 訪問記録の AsyncStorage 操作
│   └── storage.ts           # AsyncStorage ラッパー
└── utils/
    ├── distance.ts          # 距離計算
    ├── sort.ts              # ソート処理
    └── format.ts            # データフォーマット
```

**命名規則**:
- camelCase で命名
- 純粋関数を優先

**責務**:
- 外部API呼び出し
- AsyncStorage 操作
- データ変換・計算ロジック

### `/types` - TypeScript 型定義

プロジェクト全体で使用する型定義。

```
types/
├── temple.ts                # 札所関連の型
├── map.ts                   # 地図関連の型
├── routing.ts               # 経路関連の型
└── index.ts                 # 型の再エクスポート
```

**例**:
```typescript
// types/temple.ts
export interface Temple {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export type VisitStatus = 'visited' | 'not-visited';
```

### `/constants` - 定数定義

プロジェクト全体で使用する定数。

```
constants/
├── map.ts                   # 地図の初期設定
├── routes.ts                # ルート定義（Expo Router パス）
└── config.ts                # アプリ設定
```

**例**:
```typescript
// constants/map.ts
export const DEFAULT_CENTER = {
  latitude: 35.9916,
  longitude: 139.0858,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}; // 秩父市中心部

// constants/routes.ts
export const ROUTES = {
  MAP: '/',
  TEMPLES: '/temples',
  TEMPLE_DETAIL: (id: number) => `/temple/${id}`,
  PROGRESS: '/progress',
} as const;
```

## ファイル命名規則

### 基本ルール

| ファイル種別 | 命名規則 | 例 |
|-------------|---------|-----|
| コンポーネント | PascalCase | `TempleCard.tsx` |
| フック | camelCase + use | `useVisitedTemples.ts` |
| ユーティリティ | camelCase | `distance.ts` |
| 型定義 | camelCase | `temple.ts` |
| 定数 | camelCase | `map.ts` |

### 拡張子

- TypeScript: `.ts`
- React コンポーネント: `.tsx`

## インポートパス

### エイリアス設定（tsconfig.json）

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### インポート例

```typescript
// 絶対パスでインポート（推奨）
import { Temple } from '@/types/temple';
import { TempleCard } from '@/components/temple/TempleCard';
import { useVisitedTemples } from '@/hooks/useVisitedTemples';
import templesData from '@/assets/data/temples.json';

// 相対パスは避ける
// import { Temple } from '../../../types/temple'; // ❌
```

## コード配置の判断基準

### コンポーネントの配置

| 条件 | 配置先 |
|------|--------|
| 画面固有のコンポーネント | `/app/` 内 または `/components/[feature]/` |
| 2つ以上の画面で使用 | `/components/` |
| 汎用的なUIパーツ | `/components/ui/` |

### ロジックの配置

| 条件 | 配置先 |
|------|--------|
| 状態管理を含むロジック | `/hooks/` |
| 純粋関数のユーティリティ | `/lib/utils/` |
| 外部API呼び出し | `/lib/api/` |
| AsyncStorage操作 | `/lib/storage/` |

## Next.js との主な違い

| Next.js (Web版) | Expo Router (モバイル版) |
|----------------|------------------------|
| `src/app/` | `app/` |
| `public/data/` | `assets/data/` |
| `localStorage` | `AsyncStorage` |
| `useRouter` (next/navigation) | `useRouter` (expo-router) |
| `<Link href="...">` | `<Link href="...">` (expo-router) |
| CSS / Tailwind | `StyleSheet.create()` |
| `<div>`, `<p>` 等 | `<View>`, `<Text>` 等 |

## まとめ

- **Expo Router 準拠**: ファイルベースルーティングの規約に従う
- **機能別分類**: 地図、札所、レイアウトで分類
- **絶対パスインポート**: `@/` エイリアスを使用
- **段階的作成**: 必要なディレクトリのみ作成
