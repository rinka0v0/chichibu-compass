# テストガイド

## 概要

このドキュメントは、Expo (React Native) プロジェクトのテスト戦略と実装方法を定義します。

## テスト方針

### 基本方針

このプロジェクトは個人開発・小規模なため、包括的なテストは不要。
**重要なビジネスロジックのみ**テストする。

### テスト対象と手法

| 対象 | テスト手法 | 優先度 |
|------|-----------|--------|
| ユーティリティ関数 | Jest 単体テスト | 高 |
| カスタムフック | React Native Testing Library | 中 |
| UIコンポーネント | 手動テスト | 低 |
| E2E / ナビゲーション | 手動テスト | 低 |

### テスト不要な箇所

- 単純な表示コンポーネント
- 外部ライブラリのラッパー（react-native-maps の Marker 等）
- 型定義のみのファイル

## セットアップ

### 必要なパッケージ

```bash
npm install --save-dev jest @types/jest
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### jest.config.js

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
};
```

### package.json スクリプト

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

## ユーティリティ関数のテスト

### 距離計算のテスト

```typescript
// lib/utils/__tests__/distance.test.ts
import { calculateDistance, formatDistance } from '../distance';

describe('calculateDistance', () => {
  it('同じ座標の距離は0', () => {
    const point = { latitude: 36.0, longitude: 139.0 };
    expect(calculateDistance(point, point)).toBe(0);
  });

  it('1番と2番の距離を計算', () => {
    const temple1 = { latitude: 36.027278, longitude: 139.120694 };
    const temple2 = { latitude: 36.014670, longitude: 139.131243 };
    const distance = calculateDistance(temple1, temple2);
    // 実際の距離は約1.5km程度
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(3000);
  });
});

describe('formatDistance', () => {
  it('1000m未満はメートル表示', () => {
    expect(formatDistance(500)).toBe('500m');
  });

  it('1000m以上はキロメートル表示', () => {
    expect(formatDistance(1500)).toBe('1.5km');
  });
});
```

### 札所データのテスト

```typescript
// lib/utils/__tests__/temples.test.ts
import { getAllTemples, getTempleById, sortTemples } from '../temples';

describe('getAllTemples', () => {
  it('34ヶ所のデータを返す', () => {
    const temples = getAllTemples();
    expect(temples).toHaveLength(34);
  });

  it('全てのデータが必須フィールドを持つ', () => {
    const temples = getAllTemples();
    temples.forEach(temple => {
      expect(temple.id).toBeDefined();
      expect(temple.name).toBeDefined();
      expect(temple.lat).toBeDefined();
      expect(temple.lng).toBeDefined();
    });
  });
});

describe('getTempleById', () => {
  it('正しいIDで札所を取得', () => {
    const temple = getTempleById(1);
    expect(temple?.id).toBe(1);
    expect(temple?.name).toBe('四萬部寺');
  });

  it('存在しないIDはundefinedを返す', () => {
    expect(getTempleById(99)).toBeUndefined();
  });
});

describe('sortTemples', () => {
  it('番号順にソートできる', () => {
    const temples = getAllTemples();
    const sorted = sortTemples([...temples].reverse(), 'number');
    expect(sorted[0].id).toBe(1);
    expect(sorted[33].id).toBe(34);
  });
});
```

### 進捗計算のテスト

```typescript
// types/__tests__/progress.test.ts
import { calculateProgress } from '../progress';
import type { VisitedTemplesData } from '../visit';

describe('calculateProgress', () => {
  it('全未訪問の場合は0%', () => {
    const data: VisitedTemplesData = Object.fromEntries(
      Array.from({ length: 34 }, (_, i) => [i + 1, false])
    );
    const progress = calculateProgress(data);
    expect(progress.visited).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('全訪問済みの場合は100%', () => {
    const data: VisitedTemplesData = Object.fromEntries(
      Array.from({ length: 34 }, (_, i) => [i + 1, true])
    );
    const progress = calculateProgress(data);
    expect(progress.visited).toBe(34);
    expect(progress.percentage).toBe(100);
  });

  it('17ヶ所訪問で50%', () => {
    const data: VisitedTemplesData = Object.fromEntries(
      Array.from({ length: 34 }, (_, i) => [i + 1, i < 17])
    );
    const progress = calculateProgress(data);
    expect(progress.visited).toBe(17);
    expect(progress.percentage).toBe(50);
  });
});
```

## カスタムフックのテスト

### useVisitedTemples のテスト

```typescript
// hooks/__tests__/useVisitedTemples.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useVisitedTemples } from '../useVisitedTemples';

// AsyncStorage のモック
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useVisitedTemples', () => {
  it('初期状態は全て未訪問', async () => {
    const { result } = renderHook(() => useVisitedTemples());

    // 非同期の初期化を待つ
    await act(async () => {});

    expect(result.current.isVisited(1)).toBe(false);
  });

  it('toggleVisited で訪問済みになる', async () => {
    const { result } = renderHook(() => useVisitedTemples());
    await act(async () => {});

    await act(async () => {
      await result.current.toggleVisited(1);
    });

    expect(result.current.isVisited(1)).toBe(true);
  });

  it('toggleVisited を2回呼ぶと未訪問に戻る', async () => {
    const { result } = renderHook(() => useVisitedTemples());
    await act(async () => {});

    await act(async () => {
      await result.current.toggleVisited(1);
      await result.current.toggleVisited(1);
    });

    expect(result.current.isVisited(1)).toBe(false);
  });
});
```

**注意**: AsyncStorage のモックが必要です。
`@react-native-async-storage/async-storage/jest/async-storage-mock` を使用します。

## 手動テストチェックリスト

### 地図機能

- [ ] 地図が正常に表示される
- [ ] 34ヶ所のマーカーが表示される
- [ ] マーカーをタップすると名前が表示される
- [ ] 現在位置が表示される
- [ ] ズーム操作ができる
- [ ] 経路が正しく表示される

### 札所一覧

- [ ] 34ヶ所がリスト表示される
- [ ] スクロールが滑らか
- [ ] 訪問チェックが正常に動作する
- [ ] 札所タップで詳細画面へ遷移する

### 進捗画面

- [ ] 訪問済み数が正しく表示される
- [ ] 進捗バーが正しく表示される

### データ永続化

- [ ] アプリを再起動後も訪問記録が保持される

### iOS / Android 差異

- [ ] iOS で正常動作する
- [ ] Android で正常動作する
- [ ] タブナビゲーションが両プラットフォームで正常

## Web版との主な違い

| Jest (Next.js版) | Jest (Expo版) |
|-----------------|---------------|
| `jest-environment-jsdom` | `jest-expo` プリセット |
| `localStorage` のモック | `AsyncStorage` のモック |
| Web コンポーネントのテスト | React Native コンポーネントのテスト |
| `@testing-library/react` | `@testing-library/react-native` |

## まとめ

- **Jest + jest-expo**: Expo標準のテスト環境
- **ユーティリティ関数**: 積極的にテスト（純粋関数なのでテストしやすい）
- **フック**: AsyncStorage をモックしてテスト
- **UI**: 手動テスト（コスト対効果が低いためE2Eは省略）
