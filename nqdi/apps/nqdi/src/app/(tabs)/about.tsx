import { Text, View, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Negroni Club was born out of an insatiable desire to find the best
        Negronis in the world
      </Text>
      <Text style={styles.text}>
        To achieve this lofty goal, we knew we wanted to be data driven. And yet
        we knew that we had to be the ones to gather these data that described
        the perfect blend of Gin, Vermouth and Campari
      </Text>
      <Text style={styles.text}>Who are 'we'?</Text>
      <Text style={styles.text}>
        We are the Negroni lovers of the world, great and small
      </Text>
      <Text style={styles.text}>If you're here, you're already one of us</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    paddingRight: '15%',
    paddingLeft: '15%',
    paddingBottom: 30,
    textAlign: 'center',
  },
});
