# react-native-maps 実装パターン集

## 概要

このドキュメントは、react-native-maps を使用した地図機能の実装パターンをまとめています。

## react-native-maps について

- **リポジトリ**: https://github.com/react-native-maps/react-native-maps
- **iOS**: Apple Maps（デフォルト）または Google Maps
- **Android**: Google Maps
- **特徴**:
  - React Native ネイティブ地図統合
  - Expo SDK に対応
  - マーカー、ポリライン、ポリゴンなど豊富なオーバーレイ

## インストール

```bash
npx expo install react-native-maps
```

Expo SDK 利用の場合、`expo install` で互換バージョンが自動選択されます。

## 基本セットアップ

### 1. 基本的な地図表示

```typescript
// app/(tabs)/index.tsx
import MapView, { Region } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

const DEFAULT_REGION: Region = {
  latitude: 35.9916,
  longitude: 139.0858,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={DEFAULT_REGION}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
});
```

**注意**: Web版の mapcn は `longitude/latitude/zoom` でしたが、
react-native-maps は `Region`（`latitude/longitude/latitudeDelta/longitudeDelta`）を使用します。

## パターン1: カスタムマーカーの配置

### 札所マーカーの実装

```typescript
// components/map/TempleMarker.tsx
import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Temple } from '@/types/temple';

interface TempleMarkerProps {
  temple: Temple;
  isVisited: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

export function TempleMarker({
  temple,
  isVisited,
  isSelected = false,
  onPress,
}: TempleMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: temple.lat, longitude: temple.lng }}
      onPress={onPress}
      tracksViewChanges={false}  // パフォーマンス最適化
    >
      <View style={[
        styles.marker,
        isVisited ? styles.visited : styles.notVisited,
        isSelected && styles.selected,
      ]}>
        <Text style={[styles.text, isVisited && styles.visitedText]}>
          {temple.id}
        </Text>
      </View>
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutText}>{temple.name}</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notVisited: {
    backgroundColor: '#EBEAE7',
    borderWidth: 3,
    borderColor: '#8B8680',
  },
  visited: {
    backgroundColor: '#4A7C59',
    borderWidth: 3,
    borderColor: '#2D5016',
  },
  selected: {
    width: 56,
    height: 56,
    borderWidth: 4,
    borderColor: '#D4AF37',
  },
  text: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  visitedText: {
    color: '#FFFFFF',
  },
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D6D4CF',
    minWidth: 80,
    alignItems: 'center',
  },
  calloutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
```

**重要**: `tracksViewChanges={false}` を設定することで、
マーカーの再レンダリングを抑制してパフォーマンスを向上できます。
訪問状態が変わった場合のみ `true` にする実装も可能です。

### 全マーカーの表示（最適化版）

```typescript
// components/map/TempleMarkersLayer.tsx
import { memo } from 'react';
import { TempleMarker } from './TempleMarker';
import type { Temple } from '@/types/temple';

interface TempleMarkersLayerProps {
  temples: Temple[];
  visitedIds: Set<number>;
  selectedId?: number;
  onPress: (id: number) => void;
}

// memo でラップして不要な再レンダリングを防ぐ
export const TempleMarkersLayer = memo(function TempleMarkersLayer({
  temples,
  visitedIds,
  selectedId,
  onPress,
}: TempleMarkersLayerProps) {
  return (
    <>
      {temples.map(temple => (
        <TempleMarker
          key={temple.id}
          temple={temple}
          isVisited={visitedIds.has(temple.id)}
          isSelected={temple.id === selectedId}
          onPress={() => onPress(temple.id)}
        />
      ))}
    </>
  );
});
```

## パターン2: 現在位置の表示

### expo-location を使った現在位置取得

```typescript
// hooks/useUserLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { UserLocation } from '@/types/location';

const DEFAULT_LOCATION: UserLocation = {
  latitude: 35.9916,
  longitude: 139.0858,
};

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? undefined,
      });
    })();
  }, []);

  return { location, permissionDenied };
}
```

### 現在位置マーカーコンポーネント

```typescript
// components/map/CurrentLocationMarker.tsx
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';

interface CurrentLocationMarkerProps {
  location: { latitude: number; longitude: number };
}

export function CurrentLocationMarker({ location }: CurrentLocationMarkerProps) {
  return (
    <Marker coordinate={location} tracksViewChanges={false}>
      <View style={styles.outer}>
        <View style={styles.inner} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(193, 39, 45, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C1272D',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#C1272D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
});
```

**注意**: `showsUserLocation={true}` を MapView に設定するとネイティブの青丸が表示されますが、
デザインをカスタマイズしたい場合は上記のカスタムマーカーを使用します。

## パターン3: 経路の表示（Polyline）

```typescript
// components/map/RoutePolyline.tsx
import { Polyline } from 'react-native-maps';

interface RoutePolylineProps {
  coordinates: { latitude: number; longitude: number }[];
  mode?: 'walking' | 'driving';
}

export function RoutePolyline({ coordinates, mode = 'walking' }: RoutePolylineProps) {
  const color = mode === 'walking' ? '#C1272D' : '#2D5016';

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={color}
      strokeWidth={5}
      lineDashPattern={mode === 'walking' ? [0] : undefined}
    />
  );
}
```

## パターン4: 地図の操作（MapView ref）

```typescript
// 特定の札所にアニメーションで移動
import { useRef } from 'react';
import MapView from 'react-native-maps';

const mapRef = useRef<MapView>(null);

const moveToTemple = (temple: Temple) => {
  mapRef.current?.animateToRegion(
    {
      latitude: temple.lat,
      longitude: temple.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
    500  // アニメーション時間（ms）
  );
};

// 全札所が見えるズームに戻す
const fitAllTemples = (temples: Temple[]) => {
  const coordinates = temples.map(t => ({
    latitude: t.lat,
    longitude: t.lng,
  }));
  mapRef.current?.fitToCoordinates(coordinates, {
    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
    animated: true,
  });
};

// JSX
<MapView ref={mapRef} ... />
```

## パターン5: 地図タイプの設定

```typescript
// Apple Maps / Google Maps のスタイル設定
<MapView
  mapType="standard"         // standard | satellite | hybrid
  showsCompass={true}
  showsScale={false}
  showsTraffic={false}
  rotateEnabled={false}      // 高齢者向けに回転無効化を推奨
  pitchEnabled={false}       // 3D無効化を推奨
/>
```

## パターン6: iOS / Android の差異への対応

```typescript
import { Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

// Android は Google Maps が必要
// iOS はデフォルトで Apple Maps（Google Maps も使用可能）
<MapView
  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
  ...
/>
```

**Android で Google Maps を使う場合**: `app.json` に Google Maps API キーが必要です。

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

## Web版（mapcn）との主な違い

| mapcn (Next.js版) | react-native-maps (Expo版) |
|-------------------|---------------------------|
| `<Map initialViewState={{ longitude, latitude, zoom }}>` | `<MapView initialRegion={{ latitude, longitude, latitudeDelta, longitudeDelta }}>` |
| `<Marker longitude={} latitude={}>` | `<Marker coordinate={{ latitude, longitude }}>` |
| `<Source>` + `<Layer>` | `<Polyline>` / `<Polygon>` |
| CSS でマーカースタイル | StyleSheet でスタイル |
| `dynamic import` でSSR回避 | 不要（React Native はSSRなし） |

## まとめ

- **インストール**: `npx expo install react-native-maps`
- **座標形式**: `{ latitude, longitude }` （MapLibre の `{ lat, lng }` と異なる）
- **ズーム**: `latitudeDelta` / `longitudeDelta`（`zoom` 値ではない）
- **パフォーマンス**: `tracksViewChanges={false}` と `React.memo` で最適化
- **プラットフォーム差異**: Android は `PROVIDER_GOOGLE` 設定が必要
