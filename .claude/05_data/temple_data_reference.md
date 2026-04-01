# 札所データ参照ガイド

## 概要

実際の秩父三十四箇所札所データの使用方法とユーティリティ関数の実装例をまとめています。

## 実データの概要

### データファイル

`assets/data/temples.json` — 34箇所すべての札所データ

### データ統計

- **札所数**: 34ヶ所
- **緯度範囲**: 35.95149 ～ 36.08237
- **経度範囲**: 138.95380 ～ 139.13124
- **エリア中心**: 約 lat: 36.0, lng: 139.08

## 使用例

### 1. 全札所データの取得

```typescript
// lib/utils/temples.ts
import templesData from '@/assets/data/temples.json';
import type { Temple } from '@/types/temple';

export function getAllTemples(): Temple[] {
  return templesData as Temple[];
}

const temples = getAllTemples();
console.log(`札所数: ${temples.length}`); // 34
```

### 2. IDで札所を検索

```typescript
export function getTempleById(id: number): Temple | undefined {
  return getAllTemples().find(temple => temple.id === id);
}

const temple1 = getTempleById(1);
console.log(temple1?.name); // "四萬部寺"
```

### 3. 距離計算

```typescript
// lib/utils/distance.ts

/**
 * 2点間の距離をメートルで計算（Haversine formula）
 * react-native-maps は latitude/longitude 形式を使用
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371e3;
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // メートル
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
```

**注意**: Web版では `lat`/`lng` を使用していましたが、react-native-maps の座標形式に合わせて `latitude`/`longitude` に変更しています。

### 4. 最寄りの札所を検索

```typescript
// lib/utils/temples.ts
export function findNearestTemple(
  location: { latitude: number; longitude: number },
  excludeIds: number[] = []
): Temple | undefined {
  const temples = getAllTemples().filter(t => !excludeIds.includes(t.id));
  if (temples.length === 0) return undefined;

  return temples.reduce((nearest, temple) => {
    const distToNearest = calculateDistance(location, {
      latitude: nearest.lat,
      longitude: nearest.lng,
    });
    const distToTemple = calculateDistance(location, {
      latitude: temple.lat,
      longitude: temple.lng,
    });
    return distToTemple < distToNearest ? temple : nearest;
  });
}
```

### 5. ソート機能

```typescript
export type SortOption = 'number' | 'distance' | 'name';

export function sortTemples(
  temples: Temple[],
  sortBy: SortOption,
  userLocation?: { latitude: number; longitude: number }
): Temple[] {
  const sorted = [...temples];

  switch (sortBy) {
    case 'number':
      return sorted.sort((a, b) => a.id - b.id);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'distance':
      if (!userLocation) return sorted;
      return sorted.sort((a, b) => {
        const distA = calculateDistance(userLocation, { latitude: a.lat, longitude: a.lng });
        const distB = calculateDistance(userLocation, { latitude: b.lat, longitude: b.lng });
        return distA - distB;
      });
    default:
      return sorted;
  }
}
```

### 6. 地図のデフォルト表示設定

```typescript
import type { Region } from 'react-native-maps';

export function getDefaultMapRegion(): Region {
  const temples = getAllTemples();
  const lats = temples.map(t => t.lat);
  const lngs = temples.map(t => t.lng);

  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: 0.15,   // 全34札所が収まるズームレベル
    longitudeDelta: 0.15,
  };
}
```

**注意**: Web版の MapLibre GL は `zoom` 値を使用していましたが、
react-native-maps は `latitudeDelta` / `longitudeDelta` でズームを表現します。

## React Hooks での使用

```typescript
// hooks/useTemples.ts
import { useMemo } from 'react';
import { getAllTemples, sortTemples } from '@/lib/utils/temples';
import type { Temple, SortOption } from '@/types/temple';

export function useTemples(
  sortBy: SortOption = 'number',
  userLocation?: { latitude: number; longitude: number }
) {
  const temples = useMemo(() => getAllTemples(), []);

  const sortedTemples = useMemo(
    () => sortTemples(temples, sortBy, userLocation),
    [temples, sortBy, userLocation]
  );

  return {
    temples: sortedTemples,
    totalCount: temples.length,
  };
}
```

## TypeScript 型定義

```typescript
// types/temple.ts
export interface Temple {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export type TempleData = Temple[];
export type SortOption = 'number' | 'distance' | 'name';
export type FilterOption = 'all' | 'visited' | 'not-visited';
```

## パフォーマンス最適化

### 1. useMemo でのメモ化

```typescript
const sortedTemples = useMemo(
  () => sortTemples(temples, sortBy, userLocation),
  [temples, sortBy, userLocation]
);
```

### 2. FlatList での仮想化

React Native では大量リストには必ず `FlatList` を使用します。
`ScrollView` + `map()` は全要素をレンダリングするためパフォーマンスが悪化します。

```typescript
// ✅ Good
<FlatList
  data={temples}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => <TempleCard temple={item} />}
/>

// ❌ Bad（34件程度なら問題ないが習慣として避ける）
<ScrollView>
  {temples.map(t => <TempleCard key={t.id} temple={t} />)}
</ScrollView>
```

## まとめ

- 実データは `assets/data/temples.json` に34箇所分を格納
- `lat`, `lng` を内部データとして使用（react-native-maps 呼び出し時に `latitude`/`longitude` に変換）
- `address` フィールドは将来的に追加可能
- React Native では `FlatList` でリストを仮想化
