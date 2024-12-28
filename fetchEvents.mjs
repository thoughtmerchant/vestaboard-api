import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

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
      maxResults: 4, // Limit to the next 4 events
      singleEvents: true, // Expand recurring events into individual instances
      orderBy: 'startTime', // Sort by start time
    });

    const events = data.items.map(event => {
      const start = event.start.dateTime || event.start.date; // Handle both all-day and timed events
      const formattedTime = new Date(start).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const truncatedName = (event.summary || 'No Title').slice(0, 12); // Truncate the name to 12 characters

      return { time: formattedTime, name: truncatedName };
    });

    console.log('Upcoming Events:', events);
    return events;
  } catch (error) {
    console.error('Error fetching events:', error.message);
    throw error;
  }
}

// Execute the script
fetchUpcomingEvents();