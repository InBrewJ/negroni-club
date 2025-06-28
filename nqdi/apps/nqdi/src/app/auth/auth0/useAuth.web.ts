// auth/useAuth.web.js
import { useAuth0 } from '@auth0/auth0-react';

export const useAuth = () => {
    const { loginWithRedirect, logout: webLogout, user, error, isLoading } = useAuth0();
    
    const login = async () => {
        await loginWithRedirect();
    };

    const logout = async () => {
        await webLogout({ logoutParams: { returnTo: window.location.origin } });
    };

    return { login, logout, user, error, isLoading };
}

export default useAuth;
