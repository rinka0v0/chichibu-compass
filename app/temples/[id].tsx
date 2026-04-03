import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';
import { useVisitedTemples } from '@/contexts/visited-temples-context';

export default function TempleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const temple = temples.find((t) => t.id === Number(id));
  const { toggle, isVisited } = useVisitedTemples();

  const visited = temple ? isVisited(temple.id) : false;

  useEffect(() => {
    if (temple) {
      navigation.setOptions({ title: `第${temple.id}番 ${temple.name}` });
    }
  }, [temple]);

  if (!temple) return null;

  function openMaps() {
    const label = encodeURIComponent(temple!.name);
    const url = Platform.select({
      ios: `maps://?daddr=${temple!.lat},${temple!.lng}&q=${label}`,
      android: `geo:${temple!.lat},${temple!.lng}?q=${temple!.lat},${temple!.lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${temple!.lat},${temple!.lng}`,
    });
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${temple!.lat},${temple!.lng}`);
    });
  }

  return (
    <ScrollView>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: temple.lat,
          longitude: temple.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker
          coordinate={{ latitude: temple.lat, longitude: temple.lng }}
          pinColor={visited ? '#27ae60' : '#c0392b'}
        />
      </MapView>

      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.number}>第{temple.id}番</ThemedText>
          <ThemedText style={styles.name}>{temple.name}</ThemedText>
          {visited && (
            <View style={styles.visitedBadge}>
              <Text style={styles.visitedBadgeText}>✓ 参拝済み</Text>
            </View>
          )}
        </View>

        <View style={styles.row}>
          <ThemedText style={styles.label}>住所</ThemedText>
          <ThemedText style={styles.value}>{temple.address}</ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.visitButton, visited && styles.visitButtonDone]}
          onPress={() => toggle(temple.id)}
        >
          <Text style={[styles.visitButtonText, visited && styles.visitButtonTextDone]}>
            {visited ? '✓ 参拝済みを取り消す' : '参拝済みにする'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={openMaps}>
          <Text style={styles.navButtonText}>ナビを開く</Text>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 200,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  number: {
    fontSize: 13,
    opacity: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  visitedBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#eafaf1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#a9dfbf',
  },
  visitedBadgeText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    opacity: 0.5,
    width: 40,
    paddingTop: 1,
  },
  value: {
    fontSize: 14,
    flex: 1,
  },
  visitButton: {
    marginTop: 8,
    backgroundColor: '#c0392b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  visitButtonDone: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#27ae60',
  },
  visitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  visitButtonTextDone: {
    color: '#27ae60',
  },
  navButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#c0392b',
  },
  navButtonText: {
    color: '#c0392b',
    fontSize: 15,
    fontWeight: '600',
  },
});
