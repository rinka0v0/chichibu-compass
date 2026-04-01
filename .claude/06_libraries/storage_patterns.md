# AsyncStorage 実装パターン集

## 概要

このドキュメントは、`@react-native-async-storage/async-storage` を使用したデータ永続化の実装パターンをまとめています。
Web版の `localStorage` に相当しますが、**非同期（async/await）** である点が大きく異なります。

## AsyncStorage について

- **パッケージ**: `@react-native-async-storage/async-storage`
- **特徴**:
  - React Native のデファクトスタンダードなストレージ
  - キーと値のペアでデータを保存（値は文字列のみ）
  - JSON を文字列化して保存
  - **非同期** — 全操作が Promise を返す

## インストール

```bash
npx expo install @react-native-async-storage/async-storage
```

## localStorage との比較

| localStorage (Web版) | AsyncStorage (モバイル版) |
|---------------------|--------------------------|
| `localStorage.setItem(key, value)` | `await AsyncStorage.setItem(key, value)` |
| `localStorage.getItem(key)` | `await AsyncStorage.getItem(key)` |
| `localStorage.removeItem(key)` | `await AsyncStorage.removeItem(key)` |
| `localStorage.clear()` | `await AsyncStorage.clear()` |
| 同期処理 | 非同期処理（async/await 必須） |
| ブラウザ制限あり | デバイスストレージ（より大きな容量） |

## 基本パターン

### ラッパー関数

```typescript
// lib/storage/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * JSON値を保存する汎用関数
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
    throw error;
  }
}

/**
 * JSON値を読み込む汎用関数
 */
export async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored !== null) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
  }
  return defaultValue;
}

/**
 * 値を削除する汎用関数
 */
export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key}:`, error);
  }
}
```

## 訪問記録の実装

### ストレージ操作関数

```typescript
// lib/storage/visitedTemples.ts
import { setStorageItem, getStorageItem } from './storage';
import type { VisitedTemplesData } from '@/types/visit';

const STORAGE_KEY = '@chichibu_compass:visited_temples';

const DEFAULT_DATA: VisitedTemplesData = Object.fromEntries(
  Array.from({ length: 34 }, (_, i) => [i + 1, false])
);

export async function loadVisitedTemples(): Promise<VisitedTemplesData> {
  return getStorageItem<VisitedTemplesData>(STORAGE_KEY, DEFAULT_DATA);
}

export async function saveVisitedTemples(data: VisitedTemplesData): Promise<void> {
  return setStorageItem(STORAGE_KEY, data);
}
```

### カスタムフック

```typescript
// hooks/useVisitedTemples.ts
import { useState, useEffect, useCallback } from 'react';
import {
  loadVisitedTemples,
  saveVisitedTemples,
} from '@/lib/storage/visitedTemples';
import { calculateProgress } from '@/types/progress';
import type { VisitedTemplesData } from '@/types/visit';

export function useVisitedTemples() {
  const [visitedData, setVisitedData] = useState<VisitedTemplesData>({});
  const [isLoading, setIsLoading] = useState(true);

  // 初回読み込み（非同期）
  useEffect(() => {
    loadVisitedTemples().then(data => {
      setVisitedData(data);
      setIsLoading(false);
    });
  }, []);

  const isVisited = useCallback(
    (templeId: number) => visitedData[templeId] === true,
    [visitedData]
  );

  const toggleVisited = useCallback(async (templeId: number) => {
    const newData = {
      ...visitedData,
      [templeId]: !visitedData[templeId],
    };
    setVisitedData(newData);          // 即座にUIを更新
    await saveVisitedTemples(newData); // バックグラウンドで保存
  }, [visitedData]);

  const progress = calculateProgress(visitedData);

  return {
    visitedData,
    isVisited,
    toggleVisited,
    progress,
    isLoading,
  };
}
```

**重要**: 
- `useEffect` 内で `async/await` を使わずに `.then()` で処理する
  （`useEffect` のコールバックは直接 `async` にできないため）
- `toggleVisited` はUIを即座に更新した後、バックグラウンドで保存する
  （ユーザーにレスポンスよく感じさせるため）

## 汎用 AsyncStorage フック

```typescript
// hooks/useAsyncStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '@/lib/storage/storage';

export function useAsyncStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStorageItem<T>(key, defaultValue).then(stored => {
      setValue(stored);
      setIsLoading(false);
    });
  }, [key]);

  const updateValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    const resolved = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(value)
      : newValue;
    setValue(resolved);
    await setStorageItem(key, resolved);
  }, [key, value]);

  return [value, updateValue, isLoading] as const;
}

// 使用例
const [settings, setSettings, isLoading] = useAsyncStorage('app_settings', { language: 'ja' });
```

## キー管理

AsyncStorage のキーは定数で一元管理します。

```typescript
// constants/storageKeys.ts
export const STORAGE_KEYS = {
  VISITED_TEMPLES: '@chichibu_compass:visited_temples',
  APP_SETTINGS: '@chichibu_compass:app_settings',
  DATA_VERSION: '@chichibu_compass:data_version',
} as const;
```

プレフィックス `@chichibu_compass:` を付けることで、
他のアプリやライブラリが使用するキーとの衝突を防ぎます。

## データのマイグレーション

将来的にデータ構造が変わった場合の対応。

```typescript
// lib/storage/migration.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_VERSION = 1;
const VERSION_KEY = '@chichibu_compass:data_version';

export async function migrateIfNeeded(): Promise<void> {
  const versionStr = await AsyncStorage.getItem(VERSION_KEY);
  const version = versionStr ? parseInt(versionStr) : 0;

  if (version < CURRENT_VERSION) {
    await migrateToV1();
    await AsyncStorage.setItem(VERSION_KEY, CURRENT_VERSION.toString());
  }
}

async function migrateToV1(): Promise<void> {
  // 旧形式から新形式への変換処理
}
```

## エラーハンドリングのベストプラクティス

```typescript
// ✅ Good: try/catch + デフォルト値
export async function loadVisitedTemples(): Promise<VisitedTemplesData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA; // エラー時はデフォルト値
  }
}

// ✅ Good: UIへの反映は楽観的更新（optimistic update）
const toggleVisited = async (templeId: number) => {
  const newData = { ...visitedData, [templeId]: !visitedData[templeId] };
  setVisitedData(newData);          // 先にUIを更新
  await saveVisitedTemples(newData); // 後から保存（失敗してもUI操作は継続）
};

// ❌ Bad: 保存完了を待ってからUIを更新（もっさりした操作感）
const toggleVisited = async (templeId: number) => {
  const newData = { ...visitedData, [templeId]: !visitedData[templeId] };
  await saveVisitedTemples(newData); // 保存完了を待つ
  setVisitedData(newData);           // UIを更新（遅延する）
};
```

## まとめ

- **インストール**: `npx expo install @react-native-async-storage/async-storage`
- **全操作が非同期**: `await` を忘れずに
- **JSON化が必要**: オブジェクトは `JSON.stringify` / `JSON.parse` で変換
- **キーにプレフィックス**: `@app_name:key` 形式で名前空間を管理
- **楽観的更新**: UIを先に更新してからストレージに保存
- **デフォルト値**: 読み込み失敗時は必ずフォールバック
