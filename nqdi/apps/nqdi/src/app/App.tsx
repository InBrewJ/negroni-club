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

const API_URL = "http://localhost:8080"

interface Location {
  lat: number
  long: number
}

export const App = () => {
  const [whatsNextYCoord, setWhatsNextYCoord] = useState<number>(0);
  const [pingResponse, setPingResponse] = useState<string>("Waiting...")
  const [nqdiResponse, setNqdiResponse] = useState<string>("NQDI?")
  const [recentNegroniResponse, setRecentNegroniResponse] = useState<string>("Where is it?")
  const [recentNegroniLocation, setRecentNegroniLocation] = useState<Location | null>(null)
  const scrollViewRef = useRef<null | ScrollView>(null);

  const fetchPing = async () => {
    try {
      const response = await fetch(`${API_URL}/ping`)
      const json = await response.json();
      setPingResponse(json.message);
      setNqdiResponse(JSON.stringify(json.nqdi))
    } catch (error) {
      setPingResponse(`Ping error! ${error}`)
      setNqdiResponse(`NQDI error! ${error}`)
    }
  }

  const fetchRecent = async () => {
    try {
      const response = await fetch(`${API_URL}/nqdi/recent`)
      const json = await response.json();
      const {Lat, Long} = json.nqdi
      setRecentNegroniLocation({lat: Lat, long: Long})
      setRecentNegroniResponse(JSON.stringify(json.nqdi))
    } catch (error) {
      setRecentNegroniResponse(`Recent NQDI error! ${error}`)
    }
  }

  useEffect(() => {
    fetchPing();
    fetchRecent();
  }, []);

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
            <Text style={styles.textLg}>Do you like a Negroni?</Text>
            <Text style={styles.textMd}>{pingResponse}</Text>
            <Text style={styles.textMd}>Dummy NQDI: {nqdiResponse}</Text>
            <Text
              style={[styles.textXL, styles.appTitleText]}
              testID="heading"
              role="heading"
            >
              Then welcome to the Negroni Quality Discovery Index (NQDI)
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
              <TouchableOpacity
                style={styles.whatsNextButton}
                onPress={() => {
                  scrollViewRef.current?.scrollTo({
                    x: 0,
                    y: whatsNextYCoord,
                  });
                }}
              >
                <Text style={[styles.textMd, styles.textCenter]}>
                  Find nearest decent Negroni
                </Text>
              </TouchableOpacity>
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
                  Latest decent Negroni on the block...
                </Text>
                <View style={styles.section}>
                  <Text style={[styles.textSm, styles.marginBottomMd]}>
                    {recentNegroniResponse}
                  </Text>
                  <Text style={[styles.textSm, styles.marginBottomMd]}>
                    Latitude: {recentNegroniLocation?.lat} &nbsp;&nbsp;
                    Longitude: {recentNegroniLocation?.long} <br/>
                  </Text>
                  <Text style={[styles.textSm, styles.marginBottomMd]}>
                  Map goes here...
                  </Text>
                </View>
              </View>
            </View>
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
    color: '#6b7280',
  },
  section: {
    marginVertical: 12,
    marginHorizontal: 12,
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
    width: '50%',
    marginTop: 24,
  },
  learning: {
    marginVertical: 12,
  },
  love: {
    marginTop: 12,
    justifyContent: 'center',
  },
});

export default App;
