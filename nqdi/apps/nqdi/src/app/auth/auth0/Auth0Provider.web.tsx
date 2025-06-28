// auth/Auth0Provider.web.js

import React from 'react';
import { Auth0Provider as WebAuth0Provider } from '@auth0/auth0-react';

// Make sure to replace these with your actual Auth0 credentials
const AUTH0_DOMAIN = 'dev-zk85cs9r.us.auth0.com';
const AUTH0_CLIENT_ID = 'VCiPUZv4qTWchM9HUY5XuZDi5wYNqvf8';

// This is the URL Auth0 will redirect back to after authentication
// For local dev with Expo web, this is usually the root of your site.
const redirectUri = typeof window !== 'undefined' ? window.location.origin : undefined;


export const Auth0Provider = ({ children }: {children: any}) => {
  if (!redirectUri) {
    // Render nothing on the server, the provider needs the window.location
    return null;
  }
    
  return (
    <WebAuth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
    >
      {children}
    </WebAuth0Provider>
  );
};

export default Auth0Provider;
