import React from 'react';
import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Button } from 'react-native';
import * as Location from 'expo-location';
import { Stack } from 'expo-router'; // Optional: For setting screen options like title

// NOTE
// This is based on code Gemini spit out

// Default coordinates (Approximate center of the Bermuda Triangle)
const BERMUDA_TRIANGLE_LAT = 25.7617;
const BERMUDA_TRIANGLE_LON = -71.057; // West longitude is negative

const zeroValueLocation = {
  latitude: 0,
  longitude: 0,
  isDefault: false, // Add a flag to know it's the default
};

export default function LocationFinder() {
  const [location, setLocation] = useState(zeroValueLocation);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // To show loading indicator

  // Define the async function inside useEffect
    const getLocationAsync = async () => {
      setLoading(true); // Start loading
      setErrorMsg(null); // Reset errors

      console.log('Requesting location permissions...');
      // 1. Request Foreground Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();

      // 2. Handle Permission Denial
      if (status !== 'granted') {
        console.log('Permission denied.');
        setErrorMsg(
          'Permission to access location was denied. Showing default location.'
        );
        setLocation({
          latitude: BERMUDA_TRIANGLE_LAT,
          longitude: BERMUDA_TRIANGLE_LON,
          isDefault: true, // Add a flag to know it's the default
        });
        setLoading(false); // Stop loading
        return; // Exit the function
      }

      // 3. Get Location Data (if permission granted)
      console.log('Permission granted. Fetching location...');
      try {
        // Requesting a balanced accuracy for a "rough" location
        // Other options: LocationAccuracy.High, Low, Lowest
        let currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced,
        });
        console.log('Location fetched:', currentPosition);
        setLocation({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
          isDefault: false,
        });
      } catch (error) {
        console.error('Error fetching location:', error);
        setErrorMsg(
          'Failed to get location. Please ensure location services are enabled.'
        );
        // Optionally fall back to default here too, or just show error
        setLocation({
          latitude: BERMUDA_TRIANGLE_LAT,
          longitude: BERMUDA_TRIANGLE_LON,
          isDefault: true,
        });
      } finally {
        setLoading(false); // Stop loading regardless of success/error
      }
    };

  useEffect(() => {
  
    // Call the async function when the component mounts
    getLocationAsync();
  }, []); // Empty dependency array means this runs once on mount

  // Render based on state
  let textToShow = 'Waiting for location...';
  if (loading) {
    textToShow = 'Fetching location...';
  } else if (errorMsg) {
    textToShow = errorMsg;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Locate me?' }} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <Text style={styles.paragraph}>{textToShow}</Text>

      {location && (
        <View>
          <Text style={styles.coords}>
            Latitude: {location.latitude.toFixed(4)}
          </Text>
          <Text style={styles.coords}>
            Longitude: {location.longitude.toFixed(4)}
          </Text>
          {location.isDefault && (
            <Text style={styles.defaultText}>
              (Defaulting to Bermuda Triangle)
            </Text>
          )}
        </View>
      )}

      {/* Optional: Button to retry if needed */}
      {!loading && (
        <Button
          title="Retry Location"
          onPress={() =>
            getLocationAsync()
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  coords: {
    fontSize: 16,
    textAlign: 'center',
  },
  defaultText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: 'grey',
    marginTop: 5,
  },
});
