import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const BUOY_DATA_URL = 'https://www.ndbc.noaa.gov/data/5day2/46221_5day.spec';
const NOAA_TIDE_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const TIDE_PARAMS = {
  product: 'predictions',
  application: 'NOS.COOPS.TAC.WL',
  station: '9410840', // Venice Beach
  time_zone: 'lst_ldt',
  datum: 'MLLW',
  interval: 'hilo',
  units: 'english',
  format: 'json',
};

// Fetch Wave Data
async function fetchWaveData() {
  const response = await fetch(BUOY_DATA_URL);
  if (!response.ok) throw new Error(`Failed to fetch buoy data: ${response.statusText}`);

  const text = await response.text();
  const lines = text.trim().split('\n');
  const data = lines.slice(2).map(line => line.split(/\s+/)); // Skip the first two lines (headers)
  const latest = data[data.length - 1];
  const [_, __, ___, ____, _____, waveHeight, dominantPeriod, swellDirection] = latest;

  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S',
    'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const directionIndex = Math.round(parseFloat(swellDirection) / 22.5) % 16;

  return `${parseFloat(waveHeight).toFixed(1)}ft @${parseFloat(dominantPeriod).toFixed(1)}s ${directions[directionIndex]}`;
}

// Fetch Tide Data
async function fetchTideData() {
  const params = new URLSearchParams(TIDE_PARAMS).toString();
  const response = await fetch(`${NOAA_TIDE_URL}?${params}`);
  if (!response.ok) throw new Error(`Failed to fetch tide data: ${response.statusText}`);

  const { predictions } = await response.json();
  const sortedTides = predictions.map(tide => ({
    type: tide.type === 'H' ? 'HIGH' : 'LOW',
    time: new Date(tide.t),
    height: parseFloat(tide.v).toFixed(1),
  })).sort((a, b) => a.time - b.time).slice(0, 1);

  const { type, time, height } = sortedTides[0];
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${type} ${formattedTime} ${height}ft`;
}

// Fetch Meetings
async function fetchMeetings() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ access_token: process.env.GOOGLE_ACCESS_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 2,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return data.items.map(event => {
    const start = event.start.dateTime || event.start.date;
    const summary = event.summary || 'No Title';
    return `${new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} ${summary.slice(0, 12)}`;
  });
}

// Fetch All Data
async function fetchAllData() {
  try {
    console.log('Fetching wave data...');
    const waveData = await fetchWaveData();
    console.log('Wave Data:', waveData);

    console.log('Fetching tide data...');
    const tideData = await fetchTideData();
    console.log('Tide Data:', tideData);

    console.log('Fetching meeting data...');
    const meetings = await fetchMeetings();
    console.log('Meetings:', meetings);

    console.log('All data fetched successfully.');
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

// Execute Script
fetchAllData();