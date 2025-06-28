import { Button } from 'react-native';
import { useAuth } from '../auth/auth0/useAuth';

export const LoginButton = () => {
  const { login } = useAuth();

  const onLogin = async () => {
    try {
      // This single function works on web, iOS, and Android
      await login({
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
