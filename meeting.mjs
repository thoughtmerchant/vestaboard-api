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
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 4,
      singleEvents: true,
      orderBy: 'startTime',
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

// Format Meeting Data for Vestaboard
function formatMeetingData(meetings) {
    const formattedMeetings = meetings
      .map(meeting => ({
        time: new Date(meeting.start), // Assume `meeting.start` is a valid date string
        summary: meeting.summary || 'No Title', // Default to "No Title" if summary is missing
      }))
      .sort((a, b) => a.time - b.time) // Sort by time in ascending order
      .slice(0, 4) // Select only the next 4 meetings
      .map(meeting => {
        const hours = meeting.time.getHours();
        const minutes = meeting.time.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
  
        // Format components
        const timeLabel = `${(hours % 12 || 12).toString().padStart(2, ' ')}:${minutes} ${ampm}`;
        let summaryLabel = meeting.summary.slice(0, 16); // Truncate the summary if it's too long
  
        // Ensure the total length is <= 22
        const maxSpacerLength = 22 - timeLabel.length - summaryLabel.length;
        const spacer = ' '.repeat(Math.max(0, maxSpacerLength)); // Ensure spacer length is non-negative
  
        // Assemble the line
        return `${timeLabel}${spacer}${summaryLabel}`;
      });
  
    return formattedMeetings;
  }

// Send the meetings to Vestaboard
async function sendMeetingsToVestaboard() {
    const vesta = new VestaRW({ apiReadWriteKey: apiKey });
  
    try {
      console.log('Fetching upcoming meetings...');
      const meetings = await fetchUpcomingMeetings(); // Fetch meetings from Google Calendar API
  
      if (meetings.length === 0) {
        console.log('No upcoming meetings found.');
        return;
      }
  
      console.log('Formatting meetings for Vestaboard...');
      const formattedMeetings = formatMeetingData(meetings);
      const message = formattedMeetings.join('\n'); // Join formatted lines into a single message
  
      console.log('Sending meeting data to Vestaboard...');
      const result = await vesta.postMessage(message);
      console.log('Message sent successfully:', result);
    } catch (error) {
      console.error('Error sending meeting message:', error.message);
    }
  }

// Execute the script
sendMeetingsToVestaboard();