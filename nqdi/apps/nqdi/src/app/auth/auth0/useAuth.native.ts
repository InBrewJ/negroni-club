// auth/useAuth.native.js
import { useAuth0 } from 'react-native-auth0';

export const useAuth = () => {
    const { authorize, clearSession, user, error, isLoading } = useAuth0();

    const login = async () => {
        await authorize();
    };

    const logout = async () => {
        await clearSession();
    };

    return { login, logout, user, error, isLoading };
}

export default useAuth;
