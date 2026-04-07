import { LatLng } from 'react-native-maps';

const VALHALLA_ENDPOINT = 'https://valhalla1.openstreetmap.de/route';

export type ValhallaCosting = 'pedestrian' | 'auto';

export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  costing: ValhallaCosting,
): Promise<LatLng[]> {
  const body = {
    locations: [
      { lon: origin.longitude, lat: origin.latitude, type: 'break' },
      { lon: destination.longitude, lat: destination.latitude, type: 'break' },
    ],
    costing,
    directions_options: { units: 'kilometers' },
  };

  const response = await fetch(VALHALLA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Valhalla request failed: ${response.status}`);
  }

  const json = await response.json();
  const encoded: string = json.trip.legs[0].shape;
  // Valhalla uses precision=6 encoding
  return decodePolylineP6(encoded);
}

// Valhalla encodes with precision 6 (1e6), not the standard 5 (1e5).
function decodePolylineP6(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e6, longitude: lng / 1e6 });
  }

  return points;
}
