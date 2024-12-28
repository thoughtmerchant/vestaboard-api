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
async function fetchUpcomingEvents() {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  try {
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(), // Current time
      maxResults: 10, // Fetch more events to account for filtering
      singleEvents: true, // Expand recurring events into individual instances
      orderBy: 'startTime', // Sort by start time
    });

    // Filter out all-day events or events without a specific time
    const events = data.items
      .filter(event => event.start.dateTime) // Include only events with explicit time
      .slice(0, 4) // Limit to the next 4 valid events
      .map(event => {
        const start = event.start.dateTime;
        const formattedTime = new Date(start).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const truncatedName = (event.summary || 'No Title').slice(0, 12);

        return `${formattedTime.padEnd(8)} ${truncatedName.padEnd(12)}`;
      });

    console.log('Filtered and Formatted Events for Vestaboard:', events);
    return events.length > 0 ? events : ['No meetings scheduled.'];
  } catch (error) {
    console.error('Error fetching events:', error.message);
    throw error;
  }
}

// Send Events to Vestaboard
async function sendToVestaboard(events) {
  const vesta = new VestaRW({ apiReadWriteKey: apiKey });

  try {
    // Create a message by joining each event line with a newline
    const message = events.join('\n');
    console.log('Sending message to Vestaboard:', message);

    // Send the message to Vestaboard
    const result = await vesta.postMessage(message);
    console.log('Message sent successfully:', result);
  } catch (error) {
    console.error('Error sending message to Vestaboard:', error.message);
  }
}

// Execute the script
(async function () {
  try {
    console.log('Fetching upcoming events...');
    const events = await fetchUpcomingEvents();

    console.log('Sending events to Vestaboard...');
    await sendToVestaboard(events);
  } catch (error) {
    console.error('Error executing script:', error.message);
  }
})();