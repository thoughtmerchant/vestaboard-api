import { VestaRW } from 'vestaboard-api';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RW_API_KEY;

// NOAA API URL for Water Temperature
const NOAA_OBSERVATIONS_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NOAA_PARAMS = {
  product: 'water_temperature',
  application: 'NOS.COOPS.TAC.WL',
  station: '9410840', // Santa Monica, CA
  time_zone: 'lst_ldt',
  units: 'english',
  format: 'json',
  date: 'latest', // Fetch the most recent data point
};

// Fetch Latest Water Temperature Data
async function fetchWaterTempData() {
  const params = new URLSearchParams(NOAA_PARAMS).toString();
  const requestUrl = `${NOAA_OBSERVATIONS_URL}?${params}`;
  console.log(`Request URL: ${requestUrl}`);

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch water temperature data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('NOAA API Response:', JSON.stringify(data, null, 2));

  if (data.error || !data.data || data.data.length === 0) {
    throw new Error('No water temperature data available.');
  }

  return data.data[0]; // Return the latest entry
}

// Format Water Temperature Data for Vestaboard
function formatWaterTempData(temp) {
  const time = new Date(temp.t).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const temperature = `${parseFloat(temp.v).toFixed(1)}°F`;

  return `Water Temp\n${temperature}\n${time}`;
}

// Send Message to Vestaboard
async function sendWaterTempMessage() {
  const vesta = new VestaRW({ apiReadWriteKey: apiKey });

  try {
    console.log('Fetching water temperature data...');
    const temp = await fetchWaterTempData();

    console.log('Formatting water temperature data...');
    const message = formatWaterTempData(temp);

    console.log('Sending water temperature data to Vestaboard...');
    const result = await vesta.postMessage(message);
    console.log('Message sent successfully:', result);
  } catch (error) {
    console.error('Error sending water temperature message:', error.message);

    // Send fallback message to Vestaboard
    const fallbackMessage = `Water Temp\nUnavailable`;
    try {
      const result = await vesta.postMessage(fallbackMessage);
      console.log('Fallback message sent successfully:', result);
    } catch (fallbackError) {
      console.error('Error sending fallback message to Vestaboard:', fallbackError.message);
    }
  }
}

// Execute the script
sendWaterTempMessage();