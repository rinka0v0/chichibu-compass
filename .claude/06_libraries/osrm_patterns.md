# OSRM 実装パターン集

## 概要

このドキュメントは、OSRM (Open Source Routing Machine) を使用した経路検索の実装パターンをまとめています。
APIの仕様はWeb版（Next.js）と同じですが、React Native 向けに調整しています。

## OSRM について

- **公式サイト**: http://project-osrm.org/
- **デモサーバー**: `https://router.project-osrm.org`
- **特徴**:
  - 完全無料
  - APIキー不要
  - 徒歩・自動車ルート対応
  - GeoJSON形式でルート返却

## APIエンドポイント

```
https://router.project-osrm.org/route/v1/{profile}/{lng,lat};{lng,lat}?{options}
```

- `profile`: `foot`（徒歩）または `driving`（自動車）
- 座標は `経度,緯度` の順序（GeoJSON標準）

```typescript
// 徒歩ルートの例
const url = 'https://router.project-osrm.org/route/v1/foot/139.0858,35.9916;139.1207,36.0273?overview=full&geometries=geojson';
```

## 基本実装

### APIクライアント

```typescript
// lib/api/routing.ts

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

interface OSRMRouteResult {
  coordinates: { latitude: number; longitude: number }[];
  distance: number;   // メートル
  duration: number;   // 秒
}

export async function fetchRoute(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  mode: 'walking' | 'driving'
): Promise<OSRMRouteResult> {
  const profile = mode === 'walking' ? 'foot' : 'driving';

  // OSRM は 経度,緯度 の順序（GeoJSON形式）
  const coords = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
  const url = `${OSRM_BASE_URL}/${profile}/${coords}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  const geoJsonCoords: [number, number][] = route.geometry.coordinates;

  // GeoJSON の [lng, lat] を react-native-maps の { latitude, longitude } に変換
  const coordinates = geoJsonCoords.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));

  return {
    coordinates,
    distance: route.distance,
    duration: route.duration,
  };
}
```

**注意**: OSRM のレスポンスは GeoJSON形式（`[経度, 緯度]`）ですが、
react-native-maps は `{ latitude, longitude }` を期待するため変換が必要です。

### フォーマット関数

```typescript
// lib/utils/format.ts

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`;
}
```

## カスタムフック

```typescript
// hooks/useRouting.ts
import { useState, useCallback } from 'react';
import { fetchRoute } from '@/lib/api/routing';
import { formatDistance, formatDuration } from '@/lib/utils/format';

interface RouteState {
  coordinates: { latitude: number; longitude: number }[];
  distanceText: string;
  durationText: string;
}

export function useRouting() {
  const [route, setRoute] = useState<RouteState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRouteToTemple = useCallback(async (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
    mode: 'walking' | 'driving'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchRoute(start, end, mode);
      setRoute({
        coordinates: result.coordinates,
        distanceText: formatDistance(result.distance),
        durationText: formatDuration(result.duration),
      });
    } catch (err) {
      setError('経路の取得に失敗しました。もう一度お試しください。');
      console.error('Routing error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    isLoading,
    error,
    fetchRouteToTemple,
    clearRoute,
  };
}
```

## コンポーネントでの使用例

```typescript
// app/(tabs)/index.tsx（地図画面）
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import { RoutePolyline } from '@/components/map/RoutePolyline';
import { useRouting } from '@/hooks/useRouting';
import { useUserLocation } from '@/hooks/useUserLocation';

export default function MapScreen() {
  const { route, isLoading, error, fetchRouteToTemple, clearRoute } = useRouting();
  const { location } = useUserLocation();
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving'>('walking');

  const handleNavigate = async () => {
    if (!location || !selectedTemple) return;

    await fetchRouteToTemple(
      location,
      { latitude: selectedTemple.lat, longitude: selectedTemple.lng },
      routeMode
    );
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={DEFAULT_REGION}>
        {/* マーカー等 */}
        {route && (
          <RoutePolyline
            coordinates={route.coordinates}
            mode={routeMode}
          />
        )}
      </MapView>

      {/* ルート情報パネル */}
      {route && (
        <View style={styles.routePanel}>
          <Text style={styles.routeInfo}>
            {route.distanceText} • {route.durationText}
          </Text>
          <TouchableOpacity onPress={clearRoute} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>ルートを消去</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* エラー表示 */}
      {error && (
        <View style={styles.errorPanel}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleNavigate}>
            <Text style={styles.retryText}>再試行</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#C1272D" />
        </View>
      )}
    </View>
  );
}
```

## エラーハンドリング

```typescript
// よくあるエラーと対処法

// 1. ネットワークエラー
try {
  const result = await fetchRoute(start, end, mode);
} catch (err) {
  if (err instanceof TypeError && err.message === 'Network request failed') {
    // オフライン時
    setError('インターネット接続を確認してください');
  } else {
    setError('経路の取得に失敗しました');
  }
}

// 2. ルートなし（山岳地帯など徒歩ルートが存在しない場合）
if (data.code === 'NoRoute') {
  throw new Error('このルートは利用できません');
}
```

## Web版との主な違い

| Next.js (Web版) | Expo (モバイル版) |
|----------------|-----------------|
| `fetch()` は同様 | `fetch()` は同様（React Native 標準搭載） |
| `coordinates.map(c => [c.lng, c.lat])` (MapLibre用) | `coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))` (react-native-maps用) |
| React Query 使用可能 | React Native でも使用可能（`@tanstack/react-query`） |

## 注意事項

- OSRM デモサーバーはレート制限あり（本番利用非推奨）
- 秩父エリアのルートは正確に計算されます
- 徒歩ルート（`foot`）は山道も考慮されますが精度は地域により異なります
