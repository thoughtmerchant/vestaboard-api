import { VestaRW } from 'vestaboard-api';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RW_API_KEY;

// NOAA Buoy Data URL
const BUOY_DATA_URL = 'https://www.ndbc.noaa.gov/data/5day2/46221_5day.spec';

// Fetch Wave Height, Period, and Swell Direction Data
async function fetchWaveData() {
  console.log(`Fetching buoy data from: ${BUOY_DATA_URL}`);

  const response = await fetch(BUOY_DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch buoy data: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.trim().split('\n');

  // Parse headers and data
  const header = lines[0].split(/\s+/);
  const data = lines.slice(2).map(line => line.split(/\s+/)); // Skip the first two lines (headers)

  if (data.length === 0) {
    throw new Error('No data available in buoy file.');
  }

  // Extract the latest data
  const latest = data[data.length - 1];
  const [year, month, day, hour, minute, waveHeight, dominantPeriod, swellDirection] = latest;

  return {
    waveHeight: parseFloat(waveHeight),
    dominantPeriod: parseFloat(dominantPeriod),
    swellDirection: parseFloat(swellDirection), // Convert to float for processing
    timestamp: `${month}/${day}/${year} ${hour}:${minute}`,
  };
}

// Format Wave Data for Vestaboard
// Format Wave Data for Vestaboard
function formatWaveData(waveData) {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
    ];
    const directionIndex = Math.round(waveData.swellDirection / 22.5) % 16; // Convert angle to direction
    const direction = directions[directionIndex];
  
    return `${waveData.waveHeight.toFixed(1)}ft @${waveData.dominantPeriod.toFixed(1)}s ${direction}`;
  }

// Send Wave Data to Vestaboard
async function sendWaveMessage() {
  const vesta = new VestaRW({ apiReadWriteKey: apiKey });

  try {
    console.log('Fetching wave data...');
    const waveData = await fetchWaveData();

    console.log('Formatting wave data...');
    const message = formatWaveData(waveData);

    console.log('Sending wave data to Vestaboard...');
    const result = await vesta.postMessage(message);
    console.log('Message sent successfully:', result);
  } catch (error) {
    console.error('Error sending wave message:', error.message);

    // Send fallback message to Vestaboard
    const fallbackMessage = `Wave Data\nUnavailable`;
    try {
      const result = await vesta.postMessage(fallbackMessage);
      console.log('Fallback message sent successfully:', result);
    } catch (fallbackError) {
      console.error('Error sending fallback message to Vestaboard:', fallbackError.message);
    }
  }
}

// Execute the script
sendWaveMessage();