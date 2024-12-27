import { google } from 'googleapis';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const apiKey = process.env.RW_API_KEY;

// Function to list all calendars
async function listCalendars(oAuth2Client) {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const { data } = await calendar.calendarList.list();
  console.log('Available calendars:', data.items.map(cal => `${cal.summary} (${cal.id})`));
  return data.items;
}

// Function to get upcoming events from a specific calendar
async function getUpcomingEvents(calendarId = 'primary') {
  try {
    const { client_id, client_secret, redirect_uris } = JSON.parse(process.env.GOOGLE_CREDENTIALS).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Set tokens from environment variable
    const tokens = process.env.GOOGLE_TOKEN ? JSON.parse(process.env.GOOGLE_TOKEN) : null;
    if (!tokens) {
      throw new Error('Google tokens are missing. Please authenticate first.');
    }
    oAuth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Fetch the next 4 events
    const { data } = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 4,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = data.items.map(event => {
      const start = event.start.dateTime || event.start.date;
      const time = new Date(start).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${time} - ${event.summary || 'No Title'}`;
    });

    console.log('Upcoming events:', events);
    return events.length > 0 ? events : ['No upcoming events'];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error.message);
    throw error;
  }
}

// Function to send events to Vestaboard
async function sendMeetingsToVestaboard() {
  try {
    const { client_id, client_secret, redirect_uris } = JSON.parse(process.env.GOOGLE_CREDENTIALS).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Set tokens from environment variable
    const tokens = process.env.GOOGLE_TOKEN ? JSON.parse(process.env.GOOGLE_TOKEN) : null;
    if (!tokens) {
      throw new Error('Google tokens are missing. Please authenticate first.');
    }
    oAuth2Client.setCredentials(tokens);

    // List calendars and prompt user to select one
    const calendars = await listCalendars(oAuth2Client);
    const selectedCalendar = calendars.find(cal => cal.summary === 'Your Calendar Name'); // Replace with actual calendar name
    const calendarId = selectedCalendar ? selectedCalendar.id : 'primary';

    const events = await getUpcomingEvents(calendarId);
    const formattedEvents = events.map((event, index) => `${index + 1}. ${event}`).join('\n');

    // Convert to Vestaboard character codes
    const characters = Array(6)
      .fill(null)
      .map(() => Array(22).fill(0)); // Initialize 6x22 grid with blanks

    formattedEvents.split('\n').forEach((line, rowIndex) => {
      if (rowIndex < 6) {
        line.split('').forEach((char, colIndex) => {
          if (colIndex < 22) {
            if (char >= 'A' && char <= 'Z') characters[rowIndex][colIndex] = char.charCodeAt(0) - 64; // A-Z
            else if (char >= '0' && char <= '9') characters[rowIndex][colIndex] = char.charCodeAt(0) - 21; // 0-9
            else if (char === ' ') characters[rowIndex][colIndex] = 0; // Space
            else characters[rowIndex][colIndex] = 0; // Fallback to blank
          }
        });
      }
    });

    console.log('Prepared Vestaboard payload:', characters);

    const response = await fetch('https://rw.vestaboard.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vestaboard-Read-Write-Key': apiKey,
      },
      body: JSON.stringify({ characters }),
    });

    if (!response.ok) {
      throw new Error(`Vestaboard API Error: ${response.statusText}`);
    }

    console.log('Meetings successfully sent to Vestaboard');
  } catch (error) {
    console.error('Error sending meetings to Vestaboard:', error.message);
  }
}

sendMeetingsToVestaboard();