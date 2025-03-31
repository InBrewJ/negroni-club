/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import MapView, { Marker } from '../components/map';
import { Dimensions } from 'react-native';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import StaticSlider from '../components/StaticSlider';

const { height, width } = Dimensions.get('window');

// Expo Go won't work with localhost
// const API_URL_LOCAL = 'http://localhost:8000';
// Expo Go WILL work with a predictable local IP address
const API_URL_LOCAL = 'http://192.168.1.150:8000';
const API_URL_PROD = 'https://gin.negroni.club';
const API_URL = API_URL_PROD;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS !== 'web';

interface Location {
  Latitude: number;
  Longitude: number;
}

interface Nqdi {
  Bite: number;
  Accessories: number;
  Mouthfeel: number;
  Sweetness: number;
  UpdatedAt: Date;
}

interface Negroni extends Nqdi {
  Location: Location;
}

const defaultLastNegroni: Negroni = {
  Bite: 0,
  Accessories: 0,
  Mouthfeel: 0,
  Sweetness: 0,
  UpdatedAt: new Date(),
  Location: {
    Longitude: 0,
    Latitude: 0,
  },
};

export const App = () => {
  const [whatsNextYCoord, setWhatsNextYCoord] = useState<number>(0);
  const [pingResponse, setPingResponse] = useState<string>('Waiting...');
  useState<string>('Where is it?');
  const [recentNegroni, setRecentNegroni] =
    useState<Negroni>(defaultLastNegroni);
  useState<Location | null>(null);
  const scrollViewRef = useRef<null | ScrollView>(null);

  const router = useRouter();

  const fetchPing = async () => {
    try {
      const response = await fetch(`${API_URL}/ping`);
      const json = await response.json();
      setPingResponse(json.message);
    } catch (error) {
      setPingResponse(`Ping error! ${error}`);
    }
  };

  const fetchRecent = async () => {
    try {
      const response = await fetch(`${API_URL}/nqdi/recent`);
      const json = await response.json();
      const { Lat, Long, Bite, Accessories, Mouthfeel, Sweetness, UpdatedAt } =
        json.nqdi;

      setRecentNegroni({
        Bite: Number(Bite),
        Accessories: Number(Accessories),
        Mouthfeel: Number(Mouthfeel),
        Sweetness: Number(Sweetness),
        Location: {
          Latitude: Number(Lat),
          Longitude: Number(Long),
        },
        UpdatedAt: new Date(UpdatedAt),
      });
    } catch (error) {
      console.error(`Recent NQDI error! ${error}`);
      setRecentNegroni(defaultLastNegroni);
    }
  };

  useEffect(() => {
    fetchPing();
    fetchRecent();
    // Note to future self, have a look at react native paper:
    // https://reactnativepaper.com/
  }, []);

  const recentNegroniExists =
    (recentNegroni?.Location.Longitude && recentNegroni?.Location.Latitude) ||
    false;

  // @ts-ignore
  const mapRef = useRef<MapView>(null);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          ref={(ref) => {
            scrollViewRef.current = ref;
          }}
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <View style={styles.section}>
            <Text style={styles.textLg}>Do you love a Negroni?</Text>
            <Text style={styles.textSubtle}>from ping | {pingResponse}</Text>
            <Text
              style={[styles.textXL, styles.appTitleText]}
              testID="heading"
              role="heading"
            >
              {/* Note - needs custom negroni SVG */}
              You're in the right place. Welcome to Negroni Club🍹
            </Text>
          </View>
          <View style={styles.section}>
            <View style={styles.hero}>
              <View style={styles.heroTitle}>
                <Svg
                  width={32}
                  height={32}
                  stroke="hsla(162, 47%, 50%, 1)"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </Svg>
                <Text style={[styles.textLg, styles.heroTitleText]}>
                  You're ready to discover the best Negroni ever
                </Text>
              </View>
              <View style={styles.ctaButtonContainer}>
                <TouchableOpacity
                  style={styles.whatsNextButton}
                  onPress={() => {
                    scrollViewRef.current?.scrollTo({
                      x: 0,
                      y: whatsNextYCoord,
                    });
                  }}
                >
                  <Text style={[styles.textMd, styles.textCenter]}>Find</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.whatsNextButton}
                  onPress={() => {
                    router.push('/screens/contribute');
                  }}
                >
                  <Text style={[styles.textMd, styles.textCenter]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.hero}>
              <View style={styles.heroTitle}>
                <Svg
                  width={32}
                  height={32}
                  stroke="hsla(162, 47%, 50%, 1)"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </Svg>
                <Text style={[styles.textLg, styles.heroTitleText]}>
                  Latest decent Negroni on the blockroachDB
                </Text>
              </View>
              <View style={styles.section}>
                <Text style={[styles.textMd, styles.marginBottomMd]}>
                  House of Tides, UK 👑
                </Text>
                <StaticSlider label="Bite" value={recentNegroni.Bite} />
                <StaticSlider
                  label="Accessories"
                  value={recentNegroni.Accessories}
                />
                <StaticSlider
                  label="Mouthfeel"
                  value={recentNegroni.Mouthfeel}
                />
                <StaticSlider
                  label="Sweetness"
                  value={recentNegroni.Sweetness}
                />

                <Text style={styles.textSubtle}>
                  Added: {recentNegroni.UpdatedAt.toLocaleDateString()}
                </Text>
                <Text style={[styles.textSubtle, styles.marginBottomMd]}>
                  Latitude: {recentNegroni?.Location.Latitude} &nbsp;&nbsp;
                  Longitude: {recentNegroni?.Location.Longitude}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.map}>
            {!recentNegroniExists && (
              <View>
                <Text>Last Negroni not yet found...</Text>
                <Text>The search continues</Text>
              </View>
            )}
            {recentNegroniExists && isMobile === true && (
              <View style={styles.section}>
                <Text>Cool mobile map coming soon...</Text>
              </View>
            )}
            {recentNegroniExists && isWeb === true && (
              // @ts-ignore
              <MapView
                id={'same-map-id-1234'}
                style={{ flex: 1 }}
                provider="google"
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                minZoomLevel={16}
                initialRegion={{
                  latitude: recentNegroni?.Location.Latitude || 54.0,
                  longitude: recentNegroni?.Location.Longitude || 1.0,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                loadingFallback={
                  <View>
                    <Text>Loading...</Text>
                  </View>
                }
              >
                {/* TODO: figure out mobile maps */}
                {/* @ts-ignore */}
                <Marker
                  /* @ts-ignore */
                  coordinate={{
                    latitude: recentNegroni?.Location.Latitude,
                    longitude: recentNegroni?.Location.Longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  title={'House of Tides: Best Negroni in Britain'}
                />
              </MapView>
            )}
          </View>

          <View
            style={styles.section}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setWhatsNextYCoord(layout.y);
            }}
          >
            <View style={styles.shadowBox}>
              <Text style={[styles.textLg, styles.marginBottomMd]}>
                Your next decent Negroni, coming soon...
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};
const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
    padding: 60,
  },
  ctaButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-evenly',
  },
  codeBlock: {
    backgroundColor: 'rgba(55, 65, 81, 1)',
    marginVertical: 12,
    padding: 12,
    borderRadius: 4,
  },
  monospace: {
    color: '#ffffff',
    fontFamily: 'Courier New',
    marginVertical: 4,
  },
  comment: {
    color: '#cccccc',
  },
  marginBottomSm: {
    marginBottom: 6,
  },
  marginBottomMd: {
    marginBottom: 18,
  },
  marginBottomLg: {
    marginBottom: 24,
  },
  textLight: {
    fontWeight: '300',
  },
  textBold: {
    fontWeight: '500',
  },
  textCenter: {
    textAlign: 'center',
  },
  text2XS: {
    fontSize: 12,
  },
  textXS: {
    fontSize: 14,
  },
  textSm: {
    fontSize: 16,
  },
  textMd: {
    fontSize: 18,
  },
  textLg: {
    fontSize: 24,
  },
  textXL: {
    fontSize: 48,
  },
  textContainer: {
    marginVertical: 12,
  },
  textSubtle: {
    color: '#929292',
  },
  section: {
    marginVertical: 12,
    marginHorizontal: 12,
  },
  map: {
    marginVertical: 12,
    // jank jank jank
    marginHorizontal: 12,
    height: Math.floor(height * 0.6),
    width: Math.floor(width * 0.6),
    // jank jank jank
  },
  shadowBox: {
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {
      width: 1,
      height: 4,
    },
    shadowRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  appTitleText: {
    paddingTop: 12,
    fontWeight: '500',
  },
  hero: {
    borderRadius: 12,
    backgroundColor: '#B00020',
    padding: 36,
    marginBottom: 24,
  },
  heroTitle: {
    flex: 1,
    flexDirection: 'row',
  },
  heroTitleText: {
    color: '#ffffff',
    marginLeft: 12,
  },
  heroText: {
    color: '#ffffff',
    marginVertical: 12,
  },
  whatsNextButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 8,
    width: '40%',
    marginTop: 24,
  },
  learning: {
    marginVertical: 12,
  },
  love: {
    marginTop: 12,
    justifyContent: 'center',
  },
  cluster: {
    backgroundColor: 'salmon',
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    fontWeight: '700',
  },
});

export default App;
