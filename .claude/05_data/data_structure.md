# データ構造設計書

## 概要

このドキュメントは、アプリケーションで扱うデータの構造と形式を定義します。

## データソースの分類

| データ種別 | 保存場所 | 更新頻度 | 例 |
|-----------|---------|---------|-----|
| 静的データ | `assets/data/temples.json` | 不変 | 札所情報 |
| クライアント状態 | メモリ（React State） | 頻繁 | 地図の表示状態 |
| 永続化データ | AsyncStorage | 中程度 | 訪問記録 |

## 1. 札所データ（静的JSON）

### ファイルパス

`assets/data/temples.json`

### データ構造

```typescript
// types/temple.ts
export interface Temple {
  id: number;           // 札所番号（1-34）
  name: string;         // 札所名（例: "四萬部寺"）
  lat: number;          // 緯度
  lng: number;          // 経度
  address?: string;     // 住所（オプショナル）
}

export type TempleData = Temple[];
```

### JSON例（実データ）

```json
[
  {
    "id": 1,
    "name": "四萬部寺",
    "lat": 36.027278,
    "lng": 139.120694
  },
  {
    "id": 2,
    "name": "真福寺",
    "lat": 36.01467023658978,
    "lng": 139.13124291190738
  }
]
```

### データ取得方法

```typescript
// lib/utils/temples.ts
import templesData from '@/assets/data/temples.json';
import type { Temple, TempleData } from '@/types/temple';

export function getAllTemples(): TempleData {
  return templesData as TempleData;
}

export function getTempleById(id: number): Temple | undefined {
  return (templesData as TempleData).find(temple => temple.id === id);
}
```

**注意**: React Native では `import` で JSON をバンドルに含めることで、オフライン時も利用可能です。

## 2. 訪問記録（AsyncStorage）

### キー名

`@chichibu_compass:visited_temples`

AsyncStorage はアプリ全体で共有されるため、プレフィックスで名前空間を管理します。

### データ構造

```typescript
// types/visit.ts
export type VisitedTemplesData = {
  [templeId: number]: boolean;
};
```

### 保存・読み込み

```typescript
// lib/storage/visitedTemples.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VisitedTemplesData } from '@/types/visit';

const STORAGE_KEY = '@chichibu_compass:visited_temples';

export async function saveVisitedTemples(data: VisitedTemplesData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save visited temples:', error);
  }
}

export async function loadVisitedTemples(): Promise<VisitedTemplesData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load visited temples:', error);
  }
  return Object.fromEntries(
    Array.from({ length: 34 }, (_, i) => [i + 1, false])
  );
}
```

**注意**: AsyncStorage の操作は全て非同期（`async/await`）です。
Web版の `localStorage` と異なり、同期的に値を取得することはできません。

## 3. 経路データ（APIレスポンス）

### API: OSRM (Open Source Routing Machine)

```typescript
// types/routing.ts
export interface RouteRequest {
  start: { latitude: number; longitude: number };
  end: { latitude: number; longitude: number };
  mode: 'walking' | 'driving';
}

// react-native-maps Polyline 用に変換後
export interface Route {
  coordinates: { latitude: number; longitude: number }[];
  distance: string;   // "1.2 km"
  duration: string;   // "15分"
}
```

## 4. 現在位置データ

```typescript
// types/location.ts
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const DEFAULT_LOCATION: UserLocation = {
  latitude: 35.9916,   // 秩父市中心部
  longitude: 139.0858,
};
```

## 5. 地図の状態データ

```typescript
// types/map.ts
import type { Region } from 'react-native-maps';

// react-native-maps は zoom の代わりに latitudeDelta/longitudeDelta を使用
export const DEFAULT_REGION: Region = {
  latitude: 36.0,
  longitude: 139.08,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};
```

## 6. 進捗データ（計算値）

```typescript
// types/progress.ts
export interface Progress {
  visited: number;
  total: number;
  percentage: number;
}

export function calculateProgress(visitedData: VisitedTemplesData): Progress {
  const visited = Object.values(visitedData).filter(Boolean).length;
  const total = 34;
  return { visited, total, percentage: Math.round((visited / total) * 100) };
}
```

## Web版との主な違い

| Next.js (Web版) | Expo (モバイル版) |
|----------------|------------------|
| `localStorage` (同期) | `AsyncStorage` (非同期) |
| `lat` / `lng` (MapLibre) | `latitude` / `longitude` (react-native-maps) |
| `zoom` | `latitudeDelta` / `longitudeDelta` |
| `public/data/` | `assets/data/` |

## まとめ

- **静的データ**: `import` でバンドルに含める
- **訪問記録**: AsyncStorage で非同期永続化
- **経路データ**: OSRM API から取得、react-native-maps 用に変換
- **座標**: `latitude` / `longitude` 形式（react-native-maps 標準）
