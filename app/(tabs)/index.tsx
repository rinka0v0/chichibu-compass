import { useEffect } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Callout, CalloutSubview, Marker, Region } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';

const INITIAL_REGION: Region = {
  latitude: 36.0,
  longitude: 139.07,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

function openMaps(lat: number, lng: number, name: string) {
  const label = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps://?daddr=${lat},${lng}&q=${label}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  });
  if (!url) return;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  });
}

export default function MapScreen() {
  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
  }, []);

  return (
    <MapView style={styles.map} initialRegion={INITIAL_REGION} showsUserLocation>
      {temples.map((temple) => (
        <Marker
          key={temple.id}
          coordinate={{ latitude: temple.lat, longitude: temple.lng }}
          title={`第${temple.id}番`}
          tracksViewChanges={false}
        >
          <View style={styles.pin}>
            <Text style={styles.pinText}>{temple.id}</Text>
          </View>
          <Callout>
            <ThemedView style={styles.callout}>
              <ThemedText style={styles.calloutNumber}>第{temple.id}番</ThemedText>
              <ThemedText style={styles.calloutName}>{temple.name}</ThemedText>
              <ThemedText style={styles.calloutAddress}>{temple.address}</ThemedText>
              <CalloutSubview onPress={() => openMaps(temple.lat, temple.lng, temple.name)}>
                <View style={styles.navButton}>
                  <Text style={styles.navButtonText}>ナビ開始</Text>
                </View>
              </CalloutSubview>
            </ThemedView>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#c0392b',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pinText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  callout: {
    padding: 8,
    minWidth: 160,
    gap: 2,
  },
  calloutNumber: {
    fontSize: 11,
    opacity: 0.6,
  },
  calloutName: {
    fontSize: 15,
    fontWeight: '600',
  },
  calloutAddress: {
    fontSize: 12,
    opacity: 0.7,
  },
  navButton: {
    marginTop: 8,
    backgroundColor: '#c0392b',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
