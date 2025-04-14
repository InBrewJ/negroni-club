import React from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { Stack } from 'expo-router'; // Optional: For setting screen options like title
import { useForm } from '@tanstack/react-form';
import { Negroni } from '../(tabs)';
import { API_URL } from '../backend/rest';

export type NewNegroni = Omit<Negroni, 'UpdatedAt' | 'Location'> & {
  Lat: string;
  Long: string;
};

export const ContributeScreen = () => {
  console.log('ContributeScreen RENDER');

  const sendNewContribution = async (value: NewNegroni) => {
    // surely there's a better way than this?
    const sanitised: NewNegroni = {
      Lat: String(value.Lat),
      Long: String(value.Long),
      Bite: Number(value.Bite),
      Accessories: Number(value.Accessories),
      Mouthfeel: Number(value.Mouthfeel),
      Sweetness: Number(value.Sweetness),
    };
    const response = await fetch(`${API_URL}/nqdi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitised),
    });

    console.log(
      'RESPONSE FROM POST /nqdi: ',
      JSON.stringify(response, null, 2)
    );
  };

  const form = useForm({
    // This shouldn't have to map directly to
    // exact row names
    defaultValues: {
      Lat: '0',
      Long: '0',
      Bite: 5,
      Accessories: 5,
      Mouthfeel: 5,
      Sweetness: 5,
    },
    onSubmit: async ({ value }) => {
      // Do something with form data
      console.log(value);
      await sendNewContribution(value);
    },
  });

  return (
    <View style={styles.container}>
      {/* Optional: Set the title for this screen */}
      <Stack.Screen options={{ title: 'Contribute a Negroni' }} />

      <Text style={styles.text}>Add a Negroni, you scoundrel</Text>
      <Text style={styles.text}>(Map will go here)</Text>
      <form.Field name="Bite">
        {(field) => (
          <>
            <Text>Bite</Text>
            <TextInput
              value={field.state.value}
              onChangeText={field.handleChange}
              keyboardType="numeric"
            ></TextInput>
          </>
        )}
      </form.Field>
      <form.Field name="Accessories">
        {(field) => (
          <>
            <Text>Accessories</Text>
            <TextInput
              value={field.state.value}
              onChangeText={field.handleChange}
              keyboardType="numeric"
            ></TextInput>
          </>
        )}
      </form.Field>
      <form.Field name="Mouthfeel">
        {(field) => (
          <>
            <Text>Mouthfeel</Text>
            <TextInput
              value={field.state.value}
              onChangeText={field.handleChange}
              keyboardType="numeric"
            ></TextInput>
          </>
        )}
      </form.Field>
      <form.Field name="Sweetness">
        {(field) => (
          <>
            <Text>Sweetness</Text>
            <TextInput
              value={field.state.value}
              onChangeText={field.handleChange}
              keyboardType="numeric"
            ></TextInput>
          </>
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          // <button type="submit" disabled={!canSubmit}>
          //   {isSubmitting ? '...' : 'Submit'}
          // </button>
          <Button
            title={form.state.isSubmitting ? 'Submitting...' : 'Submit'}
            onPress={form.handleSubmit} // <-- Call handleSubmit onPress
            disabled={!form.state.canSubmit} // <-- Use form state to disable
          />
        )}
      />
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
