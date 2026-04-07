import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Callout, CalloutSubview, LatLng, Marker, Polyline, Region } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';
import { Temple } from '@/types/temple';
import { useVisitedTemples } from '@/contexts/visited-temples-context';
import { fetchRoute, ValhallaCosting } from '@/utils/valhalla';

const INITIAL_REGION: Region = {
  latitude: 36.0,
  longitude: 139.07,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

const TOTAL_TEMPLES = 34;

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const { isVisited, toggle, count } = useVisitedTemples();
  const [destination, setDestination] = useState<Temple | null>(null);
  const [mode, setMode] = useState<'WALKING' | 'DRIVING'>('WALKING');
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const valhallaCosting: ValhallaCosting = mode === 'WALKING' ? 'pedestrian' : 'auto';

  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords([]);
      return;
    }
    fetchRoute(origin, { latitude: destination.lat, longitude: destination.lng }, valhallaCosting)
      .then((coords) => {
        setRouteCoords(coords);
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
          animated: true,
        });
      })
      .catch((err) => console.warn('Valhalla route error:', err));
  }, [origin, destination, valhallaCosting]);

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
    // ナビ開始時に現在地へ自動センタリング
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    mapRef.current?.animateToRegion({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 600);
  }

  function clearRoute() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setOrigin(null);
    setDestination(null);
    setRouteCoords([]);
  }

  async function centerOnCurrentLocation() {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      await Location.requestForegroundPermissionsAsync();
    }
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 600);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
      >
        {temples.map((temple) => {
          const visited = isVisited(temple.id);
          return (
            <Marker
              key={temple.id}
              coordinate={{ latitude: temple.lat, longitude: temple.lng }}
              title={`第${temple.id}番`}
              tracksViewChanges={false}
            >
              <View style={[styles.pin, visited ? styles.pinVisited : styles.pinUnvisited]}>
                <Text style={styles.pinText}>{temple.id}</Text>
                {visited && <View style={styles.pinCheck} />}
              </View>
              <Callout>
                <ThemedView style={styles.callout}>
                  <View style={styles.calloutHeader}>
                    <ThemedText style={styles.calloutNumber}>第{temple.id}番</ThemedText>
                    <View style={[styles.visitedBadge, visited ? styles.visitedBadgeOn : styles.visitedBadgeOff]}>
                      <Text style={[styles.visitedBadgeText, visited ? styles.visitedBadgeTextOn : styles.visitedBadgeTextOff]}>
                        {visited ? '参拝済み' : '未参拝'}
                      </Text>
                    </View>
                  </View>
                  <ThemedText style={styles.calloutName}>{temple.name}</ThemedText>
                  <ThemedText style={styles.calloutAddress}>{temple.address}</ThemedText>
                  <View style={styles.calloutActions}>
                    <CalloutSubview onPress={() => toggle(temple.id)}>
                      <View style={[styles.toggleButton, visited ? styles.toggleButtonVisited : styles.toggleButtonUnvisited]}>
                        <Text style={styles.toggleButtonText}>
                          {visited ? '✓ 参拝済み' : '参拝済みにする'}
                        </Text>
                      </View>
                    </CalloutSubview>
                    <CalloutSubview onPress={() => startNavigation(temple)}>
                      <View style={styles.navButton}>
                        <Text style={styles.navButtonText}>ナビ開始</Text>
                      </View>
                    </CalloutSubview>
                  </View>
                </ThemedView>
              </Callout>
            </Marker>
          );
        })}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#c0392b"
          />
        )}
      </MapView>

      {/* 進捗サマリーバッジ */}
      <View style={styles.progressBadge}>
        <Text style={styles.progressBadgeText}>
          {count} / {TOTAL_TEMPLES} 参拝済み
        </Text>
      </View>

      {/* 現在地ボタン */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnCurrentLocation}>
        <Text style={styles.locationButtonText}>⊙</Text>
      </TouchableOpacity>

      {destination && (
        <View style={styles.bottomBar}>
          <Text style={styles.destinationLabel} numberOfLines={1}>
            ▶ 第{destination.id}番 {destination.name}
          </Text>
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
  // マーカー
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  pinUnvisited: {
    backgroundColor: '#c0392b',
  },
  pinVisited: {
    backgroundColor: '#27ae60',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  pinCheck: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // コールアウト
  callout: {
    padding: 10,
    width: 200,
    flexDirection: 'column',
    gap: 3,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  calloutNumber: {
    fontSize: 11,
    opacity: 0.6,
  },
  visitedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  visitedBadgeOn: {
    backgroundColor: '#eafaf1',
    borderWidth: 1,
    borderColor: '#a9dfbf',
  },
  visitedBadgeOff: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#f5c6c6',
  },
  visitedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  visitedBadgeTextOn: {
    color: '#27ae60',
  },
  visitedBadgeTextOff: {
    color: '#c0392b',
  },
  calloutName: {
    fontSize: 15,
    fontWeight: '600',
  },
  calloutAddress: {
    fontSize: 12,
    opacity: 0.7,
  },
  calloutActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleButtonVisited: {
    backgroundColor: '#eafaf1',
    borderColor: '#a9dfbf',
  },
  toggleButtonUnvisited: {
    backgroundColor: '#fff5f5',
    borderColor: '#f5c6c6',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#c0392b',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // 進捗サマリーバッジ
  progressBadge: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  // 現在地ボタン
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButtonText: {
    fontSize: 22,
    color: '#c0392b',
  },
  // ボトムバー
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
  },
  destinationLabel: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#c0392b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 260,
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
