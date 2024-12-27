import { google } from 'googleapis';
import dotenv from 'dotenv';
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const apiKey = process.env.RW_API_KEY;

dotenv.config();

async function getUpcomingEvents() {
  try {
    const { client_id, client_secret, redirect_uris } = JSON.parse(process.env.GOOGLE_CREDENTIALS).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Set tokens from environment variable
    oAuth2Client.setCredentials(JSON.parse(process.env.GOOGLE_TOKEN));

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Fetch the next 4 events
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 4,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = data.items.map(event => {
      const start = event.start.dateTime || event.start.date;
      return `${new Date(start).toLocaleString()} - ${event.summary}`;
    });

    console.log('Upcoming events:', events);
    return events;
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error.message);
    throw error;
  }
}

// Example to send events to Vestaboard
async function sendMeetingsToVestaboard() {
  try {
    const events = await getUpcomingEvents();
    const formattedEvents = events.map((event, index) => `${index + 1}. ${event}`).join('\n');

    const payload = {
      characters: formattedEvents.split('\n').map(line =>
        line
          .padEnd(22)
          .split('')
          .map(char => char.charCodeAt(0) - 64 || 0) // Convert to Vestaboard character codes
      ),
    };

    console.log('Sending to Vestaboard:', payload);
    // Replace with actual Vestaboard API call
  } catch (error) {
    console.error('Error sending meetings to Vestaboard:', error.message);
  }
}

// Example usage
sendMeetingsToVestaboard();