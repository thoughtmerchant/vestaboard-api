import { google } from 'googleapis';
import { VestaRW } from 'vestaboard-api';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.RW_API_KEY;

// Google OAuth Configuration
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials
oAuth2Client.setCredentials({
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Fetch the next 4 events from Google Calendar
async function fetchUpcomingMeetings() {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  try {
    const { data } = await calendar.events.list({
      calendarId: 'primary', // Use the 'primary' calendar
      timeMin: new Date().toISOString(), // Start from the current time
      maxResults: 4, // Limit to the next 4 events
      singleEvents: true, // Expand recurring events into single instances
      orderBy: 'startTime', // Order by start time
    });

    return data.items.map(event => {
      const start = event.start.dateTime || event.start.date;
      const formattedStart = new Date(start).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${formattedStart} - ${event.summary || 'No Title'}`;
    });
  } catch (error) {
    console.error('Error fetching meetings:', error.message);
    throw error;
  }
}

// Format the meetings for Vestaboard
function formatMeetingsForVestaboard(meetings) {
  const characters = Array(6)
    .fill(null)
    .map(() => Array(22).fill(0)); // Initialize a 6x22 grid with blanks

  meetings.forEach((meeting, index) => {
    if (index < 6) {
      const line = meeting.padEnd(22).slice(0, 22); // Ensure each line fits 22 characters
      line.split('').forEach((char, colIndex) => {
        if (colIndex < 22) {
          if (char >= 'A' && char <= 'Z') characters[index][colIndex] = char.charCodeAt(0) - 64; // A-Z
          else if (char >= '0' && char <= '9') characters[index][colIndex] = char.charCodeAt(0) - 21; // 0-9
          else if (char === ' ') characters[index][colIndex] = 0; // Space
          else characters[index][colIndex] = 0; // Fallback to blank
        }
      });
    }
  });

  return characters;
}

// Send the meetings to Vestaboard
async function sendMeetingsToVestaboard() {
  const vesta = new VestaRW({ apiReadWriteKey: apiKey });

  try {
    console.log('Fetching upcoming meetings...');
    const meetings = await fetchUpcomingMeetings();

    if (meetings.length === 0) {
      console.log('No upcoming meetings found.');
      return;
    }

    console.log('Formatting meetings for Vestaboard...');
    const payload = formatMeetingsForVestaboard(meetings);

    console.log('Sending meetings to Vestaboard...');
    const result = await vesta.postMessage({ characters: payload });
    console.log('Meetings successfully sent to Vestaboard:', result);
  } catch (error) {
    console.error('Error sending meetings to Vestaboard:', error.message);
  }
}

// Execute the script
sendMeetingsToVestaboard();