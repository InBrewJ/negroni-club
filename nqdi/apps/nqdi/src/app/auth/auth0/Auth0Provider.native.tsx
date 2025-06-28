// auth/Auth0Provider.native.js

import React from 'react';
import { Auth0Provider as ReactNativeAuth0Provider } from 'react-native-auth0';

// Make sure to replace these with your actual Auth0 credentials
const AUTH0_DOMAIN = 'dev-zk85cs9r.us.auth0.com';
const AUTH0_CLIENT_ID = 'VCiPUZv4qTWchM9HUY5XuZDi5wYNqvf8';

export const Auth0Provider = ({ children }: {children: any}) => {
  return (
    <ReactNativeAuth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
      {children}
    </ReactNativeAuth0Provider>
  );
};

export default Auth0Provider;
