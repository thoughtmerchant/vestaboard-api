import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// NOAA API Configuration
const NOAA_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NOAA_PARAMS = {
  product: 'predictions',
  application: 'NOS.COOPS.TAC.WL',
  begin_date: new Date().toISOString().split('T')[0].replace(/-/g, ''), // Today's date (YYYYMMDD)
  end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, ''), // Tomorrow's date
  datum: 'MLLW',
  station: '9410840', // Venice Beach Station ID
  time_zone: 'lst_ldt',
  units: 'english',
  interval: 'hilo',
  format: 'json',
};

// Fetch Tide Data from NOAA API
async function fetchTideData() {
  const params = new URLSearchParams(NOAA_PARAMS).toString();
  const response = await fetch(`${NOAA_API_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch NOAA data: ${response.statusText}`);
  }
  const data = await response.json();
  return data.predictions;
}

// Format Tide Data
function formatTideData(tides) {
  const formattedTides = tides
    .map(tide => ({
      time: new Date(tide.t),
      value: parseFloat(tide.v).toFixed(1),
      type: tide.type === 'H' ? 'HIGH' : 'LOW',
    }))
    .sort((a, b) => a.time - b.time) // Sort by time in ascending order
    .slice(0, 4) // Select only the next 4 tides
    .map(tide => {
      const hours = tide.time.getHours();
      const minutes = tide.time.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      // Format components
      const label = tide.type.padEnd(6, ' '); // "LOW" or "HIGH" left-aligned
      const formattedTime = `${(hours % 12 || 12).toString().padStart(2, ' ')}:${minutes} ${ampm}`;
      const value = tide.value.padStart(5, ' ') + ' FT'; // Right-justify tide height with "FT"

      // Assemble the line
      return `${label}${formattedTime.padEnd(8, ' ')}${value}`;
    });

  return formattedTides;
}

// Write Data to a File
async function writeTideDataToFile() {
  try {
    console.log('Fetching tide data...');
    const tides = await fetchTideData();

    console.log('Formatting tide data...');
    const formattedTides = formatTideData(tides);

    const output = formattedTides.join('\n');
    console.log('Writing tide data to file...');
    fs.writeFileSync('./tideData.txt', output);

    console.log('Tide data written to file successfully.');
  } catch (error) {
    console.error('Error writing tide data to file:', error.message);
  }
}

writeTideDataToFile();