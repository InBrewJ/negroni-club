// File: components/StaticSlider.js (or wherever you keep components)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Define some constants for styling
const TRACK_HEIGHT = 6;
const DOT_SIZE = 13; // Diameter of the dot

interface StaticSliderProps {
  label: string;
  value: number;
  maxValue?: 10;
}

const StaticSlider = ({ label, value, maxValue = 10 }: StaticSliderProps) => {
  // Ensure value is within bounds (0 to maxValue)
  const clampedValue = Math.max(0, Math.min(value, maxValue));

  // Calculate the dot's horizontal position as a percentage
  // Note: We calculate the percentage offset for the *center* of the dot.
  const dotOffsetPercent = (clampedValue / maxValue) * 100;

  // Calculate the vertical offset to center the dot on the track
  const dotTopOffset = -(DOT_SIZE - TRACK_HEIGHT) / 2 + 3;

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.label}>
        {label} ({clampedValue.toFixed(1)})
      </Text>
      <View style={styles.trackContainer}>
        {/* Track View */}
        <View style={styles.track} />

        {/* Dot View - Absolutely Positioned */}
        <View
          style={[
            styles.dot,
            {
              left: `${dotOffsetPercent}%`, // Position based on value
              top: dotTopOffset, // Center vertically
              // We use translateX to shift the dot left by half its width,
              // effectively centering it on the percentage point.
              transform: [{ translateX: -(DOT_SIZE / 2) }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: '80%', // Take full width available
    marginBottom: 20, // Space below each slider
    paddingHorizontal: 10, // Add some horizontal padding if needed
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8, // Space between label and track
  },
  trackContainer: {
    // This container is needed to correctly calculate percentage offset for the absolute dot
    width: '100%',
    position: 'relative', // Allows absolute positioning of children relative to this container
    height: DOT_SIZE, // Make container tall enough to easily contain the centered dot
    justifyContent: 'center', // Helps center the track vertically if its height differs
  },
  track: {
    width: '100%', // Take full width of its container
    height: TRACK_HEIGHT,
    backgroundColor: 'white',
    borderRadius: TRACK_HEIGHT / 2, // Rounded ends
    borderColor: '#E0E0E0', // Light grey border to see it on white background
    borderWidth: 1,
    // Ensure the track itself is centered vertically within trackContainer
    // This isn't strictly needed with the absolute top positioning of the dot,
    // but good practice if trackContainer height > TRACK_HEIGHT
    position: 'absolute',
    top: (DOT_SIZE - TRACK_HEIGHT) / 2,
    left: 0,
  },
  dot: {
    position: 'absolute', // Position relative to trackContainer
    width: DOT_SIZE,
    height: DOT_SIZE,
    backgroundColor: '#444',
    borderRadius: DOT_SIZE / 2, // Make it a circle
    // The 'left', 'top', and 'transform' styles are applied dynamically above
  },
});

export default StaticSlider;
