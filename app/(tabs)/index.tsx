import { StyleSheet } from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { temples } from '@/data/temples';

const INITIAL_REGION: Region = {
  latitude: 36.0,
  longitude: 139.07,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

export default function MapScreen() {
  return (
    <MapView style={styles.map} initialRegion={INITIAL_REGION} showsUserLocation>
      {temples.map((temple) => (
        <Marker
          key={temple.id}
          coordinate={{ latitude: temple.lat, longitude: temple.lng }}
          title={`第${temple.id}番`}
        >
          <Callout>
            <ThemedView style={styles.callout}>
              <ThemedText style={styles.calloutNumber}>第{temple.id}番</ThemedText>
              <ThemedText style={styles.calloutName}>{temple.name}</ThemedText>
              <ThemedText style={styles.calloutAddress}>{temple.address}</ThemedText>
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
});
