# デザインシステム設計書（高齢者対応版）

## 概要

このドキュメントは、高齢者にも見やすい、白基調のシンプルなデザインシステムを定義します。
React Native の `StyleSheet` を使用し、アクセシビリティを最優先に設計します。

## デザインコンセプト

### テーマ: "Modern Temple Serenity"（モダン寺院の静寂）

- **清潔感**: 白を基調とした明るく清潔な印象
- **伝統性**: 日本の寺院を連想させる朱色と深緑
- **視認性**: 高コントラスト、大きな文字サイズ
- **シンプル**: 余計な装飾を排除し、情報に集中できるデザイン
- **親しみやすさ**: 高齢者が安心して使える優しいデザイン

### ターゲットユーザー

- **主要**: 50代以上の巡礼者
- **配慮**: 視力の低下、小さな文字が見づらい、複雑な操作が苦手
- **デバイス**: スマートフォン（屋外使用を想定）

### アクセシビリティ基準

- **大きな文字**: 本文 18px 以上、見出し 28px 以上
- **大きなタッチ領域**: ボタン・タップ可能要素は最低 48×48dp
- **明確なフィードバック**: `activeOpacity` などの視覚フィードバック

## カラーパレット

カラー値は定数ファイルで管理します。

```typescript
// constants/colors.ts
export const Colors = {
  // Primary: 寺院の朱色
  templeRed: {
    50: '#FFF5F5',
    100: '#FFE3E3',
    500: '#C1272D',  // メインカラー
    600: '#9E1F23',
    700: '#7A181A',
  },

  // Secondary: 森の深緑
  forestGreen: {
    50: '#F3F6F3',
    100: '#E3EBE0',
    500: '#4A7C59',  // 訪問済み
    600: '#2D5016',  // メインカラー
    700: '#243F12',
  },

  // Accent: 金色
  gold: {
    500: '#D4AF37',  // 選択中マーカー
  },

  // Neutral: 温かみのあるグレー
  warm: {
    white: '#FAF9F7',   // 背景色
    50: '#F5F4F2',
    100: '#EBEAE7',
    200: '#D6D4CF',
    300: '#B8B5AE',
    500: '#8B8680',
    600: '#6D6A64',
    700: '#524F4B',
    800: '#3A3835',
    900: '#1A1A1A',  // テキスト
  },
} as const;
```

**用途**:
- `templeRed.500`: 重要なボタン（経路検索など）、現在位置マーカー
- `forestGreen.500`: 訪問済みマーカー・バッジ、進捗バー
- `gold.500`: 選択中のマーカー
- `warm.900`: テキスト
- `warm.white`: 背景

## タイポグラフィ

### フォントサイズ（高齢者対応）

標準的なアプリより2〜4dp大きく設定。

```typescript
// constants/typography.ts
export const Typography = {
  sizes: {
    xs: 12,   // 最小（ラベル）
    sm: 14,   // 小（補足）
    base: 16, // 標準
    lg: 18,   // 本文（デフォルト）
    xl: 20,   // 小見出し
    '2xl': 24, // 中見出し
    '3xl': 28, // 大見出し
    '4xl': 32, // 特大（ページタイトル）
  },
  weights: {
    normal: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  lineHeights: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;
```

**重要**: 本文は18pxを基本とし、12px未満は使用しない。

### スタイル例

```typescript
const textStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.warm[900],
    lineHeight: 32 * 1.3,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.warm[900],
    lineHeight: 24 * 1.4,
  },
  body: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.warm[900],
    lineHeight: 18 * 1.8,
  },
  caption: {
    fontSize: 14,
    color: Colors.warm[600],
    lineHeight: 14 * 1.5,
  },
});
```

## スペーシング

```typescript
// constants/spacing.ts
export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;
```

### タッチ領域（高齢者対応）

```typescript
// ボタン・タップ可能要素の最小サイズ
minHeight: 48,
minWidth: 48,

// hitSlop で実際のタッチ領域を拡張
hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
```

## コンポーネントスタイル

### ボタン

```typescript
// Primary Button（メインボタン）
const primaryButton = {
  backgroundColor: '#C1272D',
  borderRadius: 12,
  paddingHorizontal: 24,
  paddingVertical: 16,
  minHeight: 48,
  shadowColor: '#C1272D',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
};

const primaryButtonText = {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: 'bold',
};

// Secondary Button（サブボタン）
const secondaryButton = {
  backgroundColor: '#2D5016',
  borderRadius: 12,
  paddingHorizontal: 24,
  paddingVertical: 16,
  minHeight: 48,
};

// Outline Button（枠線ボタン）
const outlineButton = {
  backgroundColor: '#FFFFFF',
  borderWidth: 2,
  borderColor: '#D6D4CF',
  borderRadius: 12,
  paddingHorizontal: 24,
  paddingVertical: 16,
  minHeight: 48,
};
```

### カード

```typescript
const card = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#D6D4CF',
  padding: 20,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
};
```

### バッジ

```typescript
const badgeVisited = {
  backgroundColor: '#E3EBE0',
  borderColor: '#7AA56E',
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 20,
  borderWidth: 1,
};

const badgeDefault = {
  backgroundColor: '#EBEAE7',
  borderColor: '#B8B5AE',
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 20,
  borderWidth: 1,
};
```

## 地図スタイル

### マーカースタイル

```typescript
// 未訪問マーカー
const notVisitedMarker = {
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: '#EBEAE7',
  borderWidth: 3,
  borderColor: '#8B8680',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 4,
};

// 訪問済みマーカー
const visitedMarker = {
  ...notVisitedMarker,
  backgroundColor: '#4A7C59',
  borderColor: '#2D5016',
};

// 選択中マーカー
const selectedMarker = {
  width: 56,
  height: 56,
  borderRadius: 14,
  borderWidth: 4,
  borderColor: '#D4AF37',
  shadowColor: '#D4AF37',
  shadowOpacity: 0.4,
};

// 現在位置マーカー
const currentLocationMarker = {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#C1272D',
  borderWidth: 4,
  borderColor: '#FFFFFF',
  shadowColor: '#C1272D',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 6,
  elevation: 8,
};
```

### 経路の線

```typescript
// 徒歩ルート
const walkingRoute = {
  strokeColor: '#C1272D',   // temple-red
  strokeWidth: 5,
};

// 車ルート
const drivingRoute = {
  strokeColor: '#2D5016',   // forest-green
  strokeWidth: 5,
};
```

## アイコン

### ライブラリ

**@expo/vector-icons** を使用（Expo 標準）。

```typescript
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
```

### サイズ（高齢者対応）

| 用途 | サイズ | 使用箇所 |
|------|--------|---------|
| 小 | 20 | テキスト横 |
| 中 | 24 | ボタン内 |
| 大 | 32 | タブナビゲーション |
| 特大 | 48 | 空の状態・エラー |

**重要**: 16未満のアイコンは使用しない。

### よく使うアイコン

```typescript
// 地図
<Ionicons name="map-outline" />        // タブ: 地図
<Ionicons name="list-outline" />       // タブ: 一覧
<Ionicons name="bar-chart-outline" />  // タブ: 進捗

// 操作
<Ionicons name="navigate-outline" />   // 経路表示
<Ionicons name="location-outline" />   // 現在地
<Ionicons name="checkmark" />          // チェック
<Ionicons name="chevron-back" />       // 戻る
```

## アニメーション

### トランジション

```typescript
// TouchableOpacity のフィードバック
activeOpacity={0.7}  // 通常
activeOpacity={0.8}  // ボタン

// react-native-reanimated は重いアニメーションのみ使用
// 基本はReact Native標準のAPIで対応
```

### ローディング

```typescript
// ActivityIndicator（React Native 標準）
<ActivityIndicator size="large" color="#C1272D" />
```

## ダークモード

**現時点では非対応**

理由:
- 屋外での使用がメイン → 明るい画面が適切
- 高齢者には明るい画面の方が見やすい
- シンプルさを優先

## まとめ

### デザイン原則

1. **白基調で清潔**: 明るく見やすい背景
2. **大きな文字**: 18px以上、見出しは28px以上
3. **高コントラスト**: 黒テキスト on 白背景
4. **大きなタッチ領域**: 48dp以上
5. **シンプルな構造**: 複雑な効果を排除
6. **伝統的な配色**: 寺院の朱色（#C1272D）と深緑（#2D5016）

### 技術スタック

- **スタイリング**: `StyleSheet.create()` （React Native 標準）
- **カラー**: 定数ファイル（`constants/colors.ts`）で管理
- **タイポグラフィ**: 定数ファイル（`constants/typography.ts`）で管理
- **アイコン**: `@expo/vector-icons` (Ionicons 推奨)
