import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router'; // Optional: For setting screen options like title

export const ContributeScreen = () => {
  return (
    <View style={styles.container}>
      {/* Optional: Set the title for this screen */}
      <Stack.Screen options={{ title: 'Contribute a Negroni' }} />

      <Text style={styles.text}>Add a Negroni, you scoundrel</Text>
      <Text style={styles.text}>(Map will go here)</Text>
      {/* Your map component and other UI will eventually go here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default ContributeScreen;
