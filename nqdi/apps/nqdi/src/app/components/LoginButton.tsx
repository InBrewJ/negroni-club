import { Button } from 'react-native';
import { useAuth0 } from 'react-native-auth0';

export const LoginButton = () => {
  const { authorize } = useAuth0();

  const onLogin = async () => {
    try {
      // This single function works on web, iOS, and Android
      await authorize({
        // CRITICAL: Request the audience for your Go API
        audience: 'https://gin.negroni.club',
      });
    } catch (e) {
      console.log(e);
    }
  };

  return <Button onPress={onLogin} title="Log In" />;
};

export default LoginButton;
