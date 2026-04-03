import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';

export default function TempleListScreen() {
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={temples}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/temples/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.id}</Text>
            </View>
            <View style={styles.info}>
              <ThemedText style={styles.name}>{item.name}</ThemedText>
              <ThemedText style={styles.address}>{item.address}</ThemedText>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 20,
    opacity: 0.3,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginLeft: 60,
  },
});
