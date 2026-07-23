export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const CITIES: City[] = [
  { name: "Makkah", country: "Saudi Arabia", latitude: 21.4225, longitude: 39.8262 },
  { name: "Madinah", country: "Saudi Arabia", latitude: 24.4709, longitude: 39.6111 },
  { name: "Lahore", country: "Pakistan", latitude: 31.5204, longitude: 74.3587 },
  { name: "Karachi", country: "Pakistan", latitude: 24.8607, longitude: 67.0011 },
  { name: "Islamabad", country: "Pakistan", latitude: 33.6844, longitude: 73.0479 },
  { name: "Dubai", country: "UAE", latitude: 25.2048, longitude: 55.2708 },
  { name: "Istanbul", country: "Türkiye", latitude: 41.0082, longitude: 28.9784 },
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357 },
  { name: "London", country: "UK", latitude: 51.5074, longitude: -0.1278 },
  { name: "New York", country: "USA", latitude: 40.7128, longitude: -74.006 },
  { name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832 },
  { name: "Jakarta", country: "Indonesia", latitude: -6.2088, longitude: 106.8456 },
];
