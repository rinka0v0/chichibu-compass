# コンポーネント設計書

## 概要

このドキュメントは、アプリケーションで使用するReactコンポーネント（React Native）の設計指針と詳細仕様を定義します。

## コンポーネント設計原則

### 1. 責務の明確化

- 1コンポーネント = 1つの責務
- 表示ロジックとビジネスロジックを分離
- カスタムフックで状態管理を抽出

### 2. 再利用性

- props で柔軟にカスタマイズ可能
- 汎用的なコンポーネントは `/components/ui` に配置
- ドメイン固有のコンポーネントは機能別に配置

### 3. 型安全性

- すべての props に TypeScript 型定義
- children の型も明示的に定義
- デフォルト値を適切に設定

## コンポーネント階層

```
App
├── RootLayout (_layout.tsx)
│   └── TabLayout ((tabs)/_layout.tsx)
│
├── Screen: / (地図タブ)
│   └── MapView
│       ├── TempleMarker (×34)
│       ├── CurrentLocationMarker
│       └── RoutePolyline (条件付き)
│
├── Screen: /temples (一覧タブ)
│   └── TempleList
│       └── TempleCard (×34)
│           └── VisitCheckbox
│
├── Screen: /temple/[id] (詳細)
│   └── TempleDetail
│       ├── TempleInfo
│       ├── VisitCheckbox
│       └── RouteButton
│
└── Screen: /progress (進捗タブ)
    └── ProgressView
        ├── ProgressStats
        └── TempleList
```

## レイアウトコンポーネント

### Container

コンテンツコンテナ（パディング・余白管理）。

```typescript
// components/layout/Container.tsx
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
  style?: object;
}

export function Container({ children, style }: ContainerProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
});
```

## 地図コンポーネント

### MapView

地図表示のメインコンポーネント（react-native-maps使用）。

```typescript
// components/map/MapView.tsx
import RNMapView, { Region } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { TempleMarker } from './TempleMarker';
import { CurrentLocationMarker } from './CurrentLocationMarker';
import { RoutePolyline } from './RoutePolyline';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { Temple } from '@/types/temple';

interface MapViewProps {
  temples: Temple[];
  selectedTempleId?: number;
  onTemplePress?: (templeId: number) => void;
  showRoute?: boolean;
  routeCoordinates?: { latitude: number; longitude: number }[];
}

export function MapView({
  temples,
  selectedTempleId,
  onTemplePress,
  showRoute = false,
  routeCoordinates,
}: MapViewProps) {
  const { location } = useUserLocation();

  const initialRegion: Region = {
    latitude: location?.latitude ?? 35.9916,
    longitude: location?.longitude ?? 139.0858,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <RNMapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
      >
        {temples.map(temple => (
          <TempleMarker
            key={temple.id}
            temple={temple}
            isSelected={temple.id === selectedTempleId}
            onPress={() => onTemplePress?.(temple.id)}
          />
        ))}

        {location && <CurrentLocationMarker location={location} />}

        {showRoute && routeCoordinates && (
          <RoutePolyline coordinates={routeCoordinates} />
        )}
      </RNMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
```

**使用箇所**: 地図タブ (`app/(tabs)/index.tsx`)
**詳細実装**: `.claude/06_libraries/map_patterns.md` を参照

### TempleMarker

札所マーカー（react-native-maps の Marker使用）。

```typescript
// components/map/TempleMarker.tsx
import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { useVisitedTemples } from '@/hooks/useVisitedTemples';
import type { Temple } from '@/types/temple';

interface TempleMarkerProps {
  temple: Temple;
  isSelected?: boolean;
  onPress?: () => void;
}

export function TempleMarker({ temple, isSelected = false, onPress }: TempleMarkerProps) {
  const { isVisited } = useVisitedTemples();
  const visited = isVisited(temple.id);

  return (
    <Marker
      coordinate={{ latitude: temple.lat, longitude: temple.lng }}
      onPress={onPress}
    >
      <View style={[
        styles.marker,
        visited ? styles.visited : styles.notVisited,
        isSelected && styles.selected,
      ]}>
        <Text style={[styles.markerText, visited && styles.visitedText]}>
          {temple.id}
        </Text>
      </View>
      <Callout>
        <Text>{temple.name}</Text>
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
  markerText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  visitedText: {
    color: '#FFFFFF',
  },
});
```

**詳細実装**: `.claude/06_libraries/map_patterns.md` を参照

### CurrentLocationMarker

現在位置マーカー。

```typescript
// components/map/CurrentLocationMarker.tsx
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';

interface CurrentLocationMarkerProps {
  location: { latitude: number; longitude: number };
}

export function CurrentLocationMarker({ location }: CurrentLocationMarkerProps) {
  return (
    <Marker coordinate={location}>
      <View style={styles.marker} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C1272D',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#C1272D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
});
```

### RoutePolyline

経路表示。

```typescript
// components/map/RoutePolyline.tsx
import { Polyline } from 'react-native-maps';

interface RoutePolylineProps {
  coordinates: { latitude: number; longitude: number }[];
  color?: string;
}

export function RoutePolyline({ coordinates, color = '#C1272D' }: RoutePolylineProps) {
  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={color}
      strokeWidth={5}
      lineDashPattern={[0]}
    />
  );
}
```

**詳細実装**: `.claude/06_libraries/map_patterns.md` を参照

## 札所コンポーネント

### TempleList

札所リスト（FlatList で仮想化）。

```typescript
// components/temple/TempleList.tsx
import { FlatList, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { TempleCard } from './TempleCard';
import { useVisitedTemples } from '@/hooks/useVisitedTemples';
import { useUserLocation } from '@/hooks/useUserLocation';
import { calculateDistance } from '@/lib/utils/distance';
import type { Temple } from '@/types/temple';

type SortOption = 'number' | 'distance' | 'name';
type FilterOption = 'all' | 'visited' | 'not-visited';

interface TempleListProps {
  temples: Temple[];
  sortBy?: SortOption;
  filterBy?: FilterOption;
}

export function TempleList({ temples, sortBy = 'number', filterBy = 'all' }: TempleListProps) {
  const { isVisited } = useVisitedTemples();
  const { location } = useUserLocation();

  const filteredTemples = useMemo(() => {
    let result = [...temples];

    if (filterBy === 'visited') {
      result = result.filter(t => isVisited(t.id));
    } else if (filterBy === 'not-visited') {
      result = result.filter(t => !isVisited(t.id));
    }

    if (sortBy === 'distance' && location) {
      result.sort((a, b) => {
        const distA = calculateDistance(location, { latitude: a.lat, longitude: a.lng });
        const distB = calculateDistance(location, { latitude: b.lat, longitude: b.lng });
        return distA - distB;
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => a.id - b.id);
    }

    return result;
  }, [temples, sortBy, filterBy, isVisited, location]);

  return (
    <FlatList
      data={filteredTemples}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <TempleCard temple={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 16,
  },
  separator: {
    height: 12,
  },
});
```

### TempleCard

札所カード（一覧表示用）。

```typescript
// components/temple/TempleCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useVisitedTemples } from '@/hooks/useVisitedTemples';
import { useUserLocation } from '@/hooks/useUserLocation';
import { calculateDistance, formatDistance } from '@/lib/utils/distance';
import { VisitCheckbox } from './VisitCheckbox';
import { Badge } from '@/components/ui/Badge';
import type { Temple } from '@/types/temple';

interface TempleCardProps {
  temple: Temple;
  showDistance?: boolean;
}

export function TempleCard({ temple, showDistance = true }: TempleCardProps) {
  const { isVisited, toggleVisited } = useVisitedTemples();
  const { location } = useUserLocation();
  const router = useRouter();

  const distance = location
    ? calculateDistance(location, { latitude: temple.lat, longitude: temple.lng })
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/temple/${temple.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Badge
          label={String(temple.id)}
          variant={isVisited(temple.id) ? 'success' : 'default'}
        />

        <View style={styles.info}>
          <Text style={styles.name}>{temple.name}</Text>
          {temple.address && (
            <Text style={styles.address}>{temple.address}</Text>
          )}
          {showDistance && distance !== null && (
            <Text style={styles.distance}>
              現在地から {formatDistance(distance)}
            </Text>
          )}
        </View>

        <VisitCheckbox
          checked={isVisited(temple.id)}
          onToggle={() => toggleVisited(temple.id)}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6D4CF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  address: {
    fontSize: 14,
    color: '#6D6A64',
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    color: '#9A968D',
    marginTop: 4,
  },
});
```

### TempleDetail

札所詳細情報。

```typescript
// components/temple/TempleDetail.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVisitedTemples } from '@/hooks/useVisitedTemples';
import { useUserLocation } from '@/hooks/useUserLocation';
import { calculateDistance, formatDistance } from '@/lib/utils/distance';
import { VisitCheckbox } from './VisitCheckbox';
import { Badge } from '@/components/ui/Badge';
import type { Temple } from '@/types/temple';

interface TempleDetailProps {
  temple: Temple;
}

export function TempleDetail({ temple }: TempleDetailProps) {
  const { isVisited, toggleVisited } = useVisitedTemples();
  const { location } = useUserLocation();
  const router = useRouter();

  const distance = location
    ? calculateDistance(location, { latitude: temple.lat, longitude: temple.lng })
    : null;

  const handleNavigate = () => {
    router.push({ pathname: '/', params: { templeId: temple.id, navigate: 'true' } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Badge label={`${temple.id}番札所`} />
          <Text style={styles.name}>{temple.name}</Text>
        </View>
        <VisitCheckbox
          checked={isVisited(temple.id)}
          onToggle={() => toggleVisited(temple.id)}
          size="lg"
        />
      </View>

      <View style={styles.infoList}>
        {temple.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#8B8680" />
            <Text style={styles.infoText}>{temple.address}</Text>
          </View>
        )}

        {distance !== null && (
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={20} color="#8B8680" />
            <Text style={styles.infoText}>現在地から {formatDistance(distance)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNavigate} activeOpacity={0.8}>
        <Ionicons name="navigate" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>経路を表示</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
  },
  infoList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#3A3835',
    flex: 1,
  },
  button: {
    backgroundColor: '#C1272D',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C1272D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### VisitCheckbox

訪問チェックボックス。

```typescript
// components/temple/VisitCheckbox.tsx
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VisitCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VisitCheckbox({ checked, onToggle, size = 'md' }: VisitCheckboxProps) {
  const sizeMap = { sm: 20, md: 24, lg: 32 };
  const iconSize = sizeMap[size];

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.checkbox, checked ? styles.checked : styles.unchecked]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {checked && (
        <Ionicons name="checkmark" size={iconSize * 0.7} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  checked: {
    backgroundColor: '#4A7C59',
    borderColor: '#2D5016',
  },
  unchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8B5AE',
  },
});
```

## 進捗コンポーネント

### ProgressStats

進捗統計表示。

```typescript
// components/progress/ProgressStats.tsx
import { View, Text, StyleSheet } from 'react-native';
import type { Progress } from '@/types/progress';

interface ProgressStatsProps {
  progress: Progress;
}

export function ProgressStats({ progress }: ProgressStatsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>巡礼進捗</Text>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progress.percentage}%` }]}
          />
        </View>
        <Text style={styles.percentage}>{progress.percentage}%</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>訪問済み</Text>
          <Text style={[styles.statValue, styles.visitedColor]}>{progress.visited}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>残り</Text>
          <Text style={styles.statValue}>{progress.total - progress.visited}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>全体</Text>
          <Text style={styles.statValue}>{progress.total}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 16,
    backgroundColor: '#EBEAE7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A7C59',
    borderRadius: 8,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    minWidth: 40,
    textAlign: 'right',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6D6A64',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  visitedColor: {
    color: '#4A7C59',
  },
});
```

## 汎用UIコンポーネント

### Button

```typescript
// components/ui/Button.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`${size}Size`], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: '#C1272D',
  },
  secondary: {
    backgroundColor: '#2D5016',
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D6D4CF',
  },
  smSize: { paddingHorizontal: 12, paddingVertical: 8 },
  mdSize: { paddingHorizontal: 16, paddingVertical: 12 },
  lgSize: { paddingHorizontal: 24, paddingVertical: 16 },
  text: {
    fontWeight: 'bold',
  },
  primaryText: { color: '#FFFFFF', fontSize: 16 },
  secondaryText: { color: '#FFFFFF', fontSize: 16 },
  outlineText: { color: '#1A1A1A', fontSize: 16 },
  smText: { fontSize: 14 },
  mdText: { fontSize: 16 },
  lgText: { fontSize: 18 },
  disabled: {
    opacity: 0.5,
  },
});
```

### Badge

```typescript
// components/ui/Badge.tsx
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  default: {
    backgroundColor: '#EBEAE7',
    borderColor: '#B8B5AE',
  },
  success: {
    backgroundColor: '#E3EBE0',
    borderColor: '#7AA56E',
  },
  warning: {
    backgroundColor: '#FDF5DD',
    borderColor: '#E8C960',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  defaultText: { color: '#3A3835' },
  successText: { color: '#2D5016' },
  warningText: { color: '#8F7422' },
});
```

### Spinner

```typescript
// components/ui/Spinner.tsx
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
}

export function Spinner({ size = 'large' }: SpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#C1272D" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## まとめ

- **階層構造**: レイアウト → スクリーン → 機能別コンポーネント → 汎用UI
- **責務分離**: 表示とロジックを分離、カスタムフックで状態管理
- **型安全**: すべての props に TypeScript 型定義
- **React Native**: `View`, `Text`, `TouchableOpacity`, `FlatList` などのRNコンポーネントを使用
- **スタイリング**: `StyleSheet.create()` でパフォーマンス最適化
