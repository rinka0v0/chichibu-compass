# 現在の開発タスク

最優先で取り組むべきタスクを管理するドキュメントです。

---

## 🎯 現在のフェーズ: Phase 1（セットアップ & データ準備）

---

## 📝 今すぐ取り組むべきタスク

### 1. 依存パッケージの追加 🔴 最優先

現在の `package.json` に不足しているパッケージを追加します。

```bash
# 地図
npx expo install react-native-maps

# ストレージ
npx expo install @react-native-async-storage/async-storage

# 位置情報
npx expo install expo-location
```

**チェックリスト**:
- [ ] `react-native-maps` インストール
- [ ] `@react-native-async-storage/async-storage` インストール
- [ ] `expo-location` インストール

---

### 2. 札所データの準備

**ファイル**: `assets/data/temples.json`

**必要な情報（各札所）**:
```json
{
  "id": 1,
  "name": "四萬部寺",
  "lat": 35.9916,
  "lng": 139.0858,
  "address": "埼玉県秩父市栃谷418"
}
```

**チェックリスト**:
- [ ] `assets/data/` ディレクトリ作成
- [ ] 全34ヶ所のデータ収集
- [ ] JSON形式で入力・検証

**データソース**:
- 秩父札所連合会: https://www.chichibufudasho.com/
- Google Maps: 座標取得
- OpenStreetMap: 座標確認

---

### 3. 型定義の作成

**ファイル**: `types/temple.ts`, `types/visit.ts`, `types/location.ts`, `types/routing.ts`

```typescript
// types/temple.ts
export interface Temple {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}
export type SortOption = 'number' | 'distance' | 'name';
export type FilterOption = 'all' | 'visited' | 'not-visited';

// types/visit.ts
export type VisitedTemplesData = { [templeId: number]: boolean };

// types/location.ts
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
```

**チェックリスト**:
- [ ] `types/` ディレクトリ作成
- [ ] 各型定義ファイル作成

---

### 4. ストレージ層の実装

**ファイル**: `lib/storage/storage.ts`, `lib/storage/visitedTemples.ts`

詳細実装は `.claude/06_libraries/storage_patterns.md` を参照。

**チェックリスト**:
- [ ] `lib/storage/` ディレクトリ作成
- [ ] `storage.ts` (汎用ラッパー) 実装
- [ ] `visitedTemples.ts` 実装

---

### 5. ユーティリティ関数の実装

**ファイル**: `lib/utils/temples.ts`, `lib/utils/distance.ts`, `lib/utils/format.ts`

詳細実装は `.claude/05_data/temple_data_reference.md` を参照。

**チェックリスト**:
- [ ] `lib/utils/` ディレクトリ作成
- [ ] `temples.ts` 実装
- [ ] `distance.ts` 実装（`latitude`/`longitude` 形式で実装）
- [ ] `format.ts` 実装

---

### 6. カスタムフックの実装

**ファイル**: `hooks/useVisitedTemples.ts`, `hooks/useUserLocation.ts`

詳細実装は `.claude/06_libraries/storage_patterns.md` を参照。

**チェックリスト**:
- [ ] `hooks/` ディレクトリ作成
- [ ] `useVisitedTemples.ts` 実装
- [ ] `useUserLocation.ts` 実装（`expo-location` 使用）

---

### 7. 定数ファイルの作成

**ファイル**: `constants/colors.ts`, `constants/typography.ts`, `constants/map.ts`

詳細は `.claude/04_design/design_system.md` を参照。

**チェックリスト**:
- [ ] `constants/colors.ts` 作成
- [ ] `constants/typography.ts` 作成
- [ ] `constants/map.ts` 作成（DEFAULT_REGION など）

---

## Phase 2: 画面実装

### 8. Expo Router のタブ設定

**ファイル**: `app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C1272D',
        tabBarStyle: { height: 64 },
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '地図',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="temples"
        options={{
          title: '一覧',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: '進捗',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**チェックリスト**:
- [ ] タブレイアウト実装
- [ ] タブアイコン設定
- [ ] `temples.tsx`, `progress.tsx` ファイル作成

---

### 9. 地図画面の実装

**ファイル**: `app/(tabs)/index.tsx`

詳細実装は `.claude/06_libraries/map_patterns.md` を参照。

**チェックリスト**:
- [ ] MapView 基本表示
- [ ] 34ヶ所のマーカー表示
- [ ] 現在位置マーカー
- [ ] 札所タップ時の詳細表示

---

### 10. 札所一覧画面の実装

**ファイル**: `app/(tabs)/temples.tsx`

**チェックリスト**:
- [ ] FlatList で一覧表示
- [ ] TempleCard コンポーネント
- [ ] 訪問チェックボックス

---

### 11. 進捗画面の実装

**ファイル**: `app/(tabs)/progress.tsx`

**チェックリスト**:
- [ ] ProgressStats コンポーネント
- [ ] 進捗バー表示
- [ ] 訪問済み/未訪問リスト

---

## Phase 3: 経路機能

### 12. 経路検索の実装

詳細実装は `.claude/06_libraries/osrm_patterns.md` を参照。

**チェックリスト**:
- [ ] `lib/api/routing.ts` 実装
- [ ] `hooks/useRouting.ts` 実装
- [ ] RoutePolyline コンポーネント
- [ ] 徒歩/車の切り替えUI

---

## メモ

- `npx expo install` を使用すること（`npm install` では互換性の問題が起きる場合あり）
- Android の地図には Google Maps API キーが必要な場合あり（`app.json` で設定）
- iOS シミュレーターでは位置情報が使えないため、デバッグ時は秩父のデフォルト位置を使用
