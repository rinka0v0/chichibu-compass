import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Callout, CalloutSubview, LatLng, Marker, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';
import { Temple } from '@/types/temple';
import { useVisitedTemples } from '@/contexts/visited-temples-context';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;

const INITIAL_REGION: Region = {
  latitude: 36.0,
  longitude: 139.07,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const { isVisited } = useVisitedTemples();
  const [destination, setDestination] = useState<Temple | null>(null);
  const [mode, setMode] = useState<'WALKING' | 'DRIVING'>('WALKING');
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  async function startNavigation(temple: Temple) {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      await Location.requestForegroundPermissionsAsync();
    }
    locationSubscription.current?.remove();
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 50 },
      (location) => {
        setOrigin({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      },
    );
    setDestination(temple);
  }

  function clearRoute() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setOrigin(null);
    setDestination(null);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
      >
        {temples.map((temple) => (
          <Marker
            key={temple.id}
            coordinate={{ latitude: temple.lat, longitude: temple.lng }}
            title={`第${temple.id}番`}
            tracksViewChanges={false}
          >
            <View style={[styles.pin, isVisited(temple.id) && styles.pinVisited]}>
              <Text style={styles.pinText}>{temple.id}</Text>
            </View>
            <Callout>
              <ThemedView style={styles.callout}>
                <ThemedText style={styles.calloutNumber}>第{temple.id}番</ThemedText>
                <ThemedText style={styles.calloutName}>{temple.name}</ThemedText>
                <ThemedText style={styles.calloutAddress}>{temple.address}</ThemedText>
                <CalloutSubview onPress={() => startNavigation(temple)}>
                  <View style={styles.navButton}>
                    <Text style={styles.navButtonText}>ナビ開始</Text>
                  </View>
                </CalloutSubview>
              </ThemedView>
            </Callout>
          </Marker>
        ))}

        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={{ latitude: destination.lat, longitude: destination.lng }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#c0392b"
            mode={mode}
            onReady={(result) => {
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
              });
            }}
          />
        )}
      </MapView>

      {destination && (
        <View style={styles.bottomBar}>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'WALKING' && styles.modeButtonActive]}
              onPress={() => setMode('WALKING')}
            >
              <Text style={[styles.modeButtonText, mode === 'WALKING' && styles.modeButtonTextActive]}>
                徒歩
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'DRIVING' && styles.modeButtonActive]}
              onPress={() => setMode('DRIVING')}
            >
              <Text style={[styles.modeButtonText, mode === 'DRIVING' && styles.modeButtonTextActive]}>
                車
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
            <Text style={styles.clearButtonText}>ルートを消す</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  pinVisited: {
    backgroundColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  callout: {
    padding: 8,
    width: 180,
    flexDirection: 'column',
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
    marginTop: 16,
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
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: '#c0392b',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
