import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';
import { useVisitedTemples } from '@/contexts/visited-temples-context';

const TOTAL = temples.length;

export default function TempleListScreen() {
  const { count, isVisited } = useVisitedTemples();
  const progress = count / TOTAL;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressLabel}>巡礼進捗</ThemedText>
          <ThemedText style={styles.progressCount}>
            <Text style={styles.progressCountHighlight}>{count}</Text> / {TOTAL} 寺院
          </ThemedText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
      </View>

      <FlatList
        data={temples}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const visited = isVisited(item.id);
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push(`/temples/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.badge, visited && styles.badgeVisited]}>
                <Text style={styles.badgeText}>{item.id}</Text>
                {visited && <View style={styles.checkOverlay}><Text style={styles.checkMark}>✓</Text></View>}
              </View>
              <View style={styles.info}>
                <ThemedText style={[styles.name, visited && styles.nameVisited]}>{item.name}</ThemedText>
                <ThemedText style={styles.address}>{item.address}</ThemedText>
              </View>
              {visited ? (
                <Text style={styles.visitedLabel}>参拝済</Text>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5c6c6',
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c0392b',
  },
  progressCount: {
    fontSize: 13,
    opacity: 0.7,
  },
  progressCountHighlight: {
    fontSize: 17,
    fontWeight: '700',
    color: '#c0392b',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f0d0d0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c0392b',
    borderRadius: 3,
  },
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeVisited: {
    backgroundColor: '#27ae60',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1e8449',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  nameVisited: {
    opacity: 0.6,
  },
  address: {
    fontSize: 12,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 20,
    opacity: 0.3,
  },
  visitedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#27ae60',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginLeft: 60,
  },
});
