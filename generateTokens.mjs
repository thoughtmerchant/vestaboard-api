import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']; // Scope for Calendar API
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // Local redirect URI

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Step 1: Generate the Auth URL
function getAuthUrl() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Ensures a refresh token is returned
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);
}

// Step 2: Exchange Code for Tokens
async function getTokens(authCode) {
  try {
    const { tokens } = await oAuth2Client.getToken(authCode);
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('Save these tokens in your .env file.');
  } catch (error) {
    console.error('Error retrieving access token:', error.message);
  }
}

// Command-line interface to input the auth code
function promptForAuthCode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from the page here: ', code => {
    rl.close();
    getTokens(code);
  });
}

// Run the flow
getAuthUrl();
promptForAuthCode();