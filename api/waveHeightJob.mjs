import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const waveData = await fetchWaveData();
    const formattedWaveData = formatWaveData(waveData);
    const output = formattedWaveData.join('\n');

    // Write the file in the current directory
    const filePath = path.join('/tmp', 'waveHeightData.txt');
    fs.writeFileSync(filePath, output, 'utf8');

    res.status(200).send('Wave height data written successfully');
  } catch (error) {
    console.error('Error writing wave height data:', error.message);
    res.status(500).send('Error writing wave height data');
  }
}

async function fetchWaveData() {
  const WAVE_API_URL = 'https://www.ndbc.noaa.gov/data/5day2/46221_5day.spec';

  const response = await fetch(WAVE_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch wave height data: ${response.statusText}`);
  }
  const data = await response.text();
  return data.split('\n'); // Split into lines for processing
}

function formatWaveData(waveData) {
  // Skip the header and parse the first data line
  const waveInfo = waveData.find(line => !line.startsWith('#') && line.trim() !== '').split(/\s+/);
  const waveHeight = `${parseFloat(waveInfo[8]).toFixed(1)}ft`; // Wave height in feet
  const period = `${waveInfo[9]}s`; // Wave period in seconds
  const direction = waveInfo[10]; // Wave direction in degrees

  // Convert direction from degrees to cardinal direction
  const cardinalDirection = getCardinalDirection(parseFloat(direction));

  return [`Wave Height: ${waveHeight} @ ${period} ${cardinalDirection}`];
}

function getCardinalDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}