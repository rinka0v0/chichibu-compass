import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';

export default function TempleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const temple = temples.find((t) => t.id === Number(id));

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
        <Marker coordinate={{ latitude: temple.lat, longitude: temple.lng }} />
      </MapView>

      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.number}>第{temple.id}番</ThemedText>
          <ThemedText style={styles.name}>{temple.name}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText style={styles.label}>住所</ThemedText>
          <ThemedText style={styles.value}>{temple.address}</ThemedText>
        </View>

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
  navButton: {
    marginTop: 8,
    backgroundColor: '#c0392b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
