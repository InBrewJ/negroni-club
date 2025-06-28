// Expo Go won't work with localhost
const API_URL_LOCAL = 'http://localhost:8080';
// Expo Go WILL work with a predictable local IP address (set via e.g. DHCP reservations, thank you Linksys)
// const API_URL_LOCAL = 'http://192.168.1.10:8000'; // .1.150 for ethernet
const API_URL_PROD = 'https://gin.negroni.club';
export const API_URL = API_URL_PROD;
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
