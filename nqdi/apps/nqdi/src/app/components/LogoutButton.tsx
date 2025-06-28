import { Button } from 'react-native';
import { useAuth } from '../auth/auth0/useAuth';

export const LogoutButton = () => {
    const {logout} = useAuth();

    const onPress = async () => {
        try {
            await logout();
        } catch (e) {
            console.log(e);
        }
    };

    return <Button onPress={onPress} title="Log out" />
}

export default LogoutButton;
