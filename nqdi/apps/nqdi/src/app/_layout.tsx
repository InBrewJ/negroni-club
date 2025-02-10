import { Stack } from 'expo-router';

// https://docs.expo.dev/tutorial/add-navigation/

// To get expo-router to work
// !!! Install via nx install <app-name> ... !!!
// Manual expo-router install: https://docs.expo.dev/router/installation/#manual-installation
// https://github.com/yehonadav/nx-expo-router/tree/main
// https://github.com/nrwl/nx/discussions/21847#discussioncomment-9560791
// https://github.com/expo/expo/issues/28000

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
