import fetch from 'node-fetch';
import { VestaRW } from 'vestaboard-api';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RW_API_KEY;

// Fetch tide data from NOAA API
async function fetchTideData() {
  const NOAA_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  const NOAA_PARAMS = {
    product: 'predictions',
    application: 'NOS.COOPS.TAC.WL',
    begin_date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, ''),
    datum: 'MLLW',
    station: '9410840',
    time_zone: 'lst_ldt',
    units: 'english',
    interval: 'hilo',
    format: 'json',
  };

  const params = new URLSearchParams(NOAA_PARAMS).toString();
  const response = await fetch(`${NOAA_API_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch NOAA data: ${response.statusText}`);
  }

  const data = await response.json();
  return data.predictions.map(tide => ({
    time: new Date(tide.t),
    value: parseFloat(tide.v).toFixed(1),
    type: tide.type === 'H' ? 'HIGH' : 'LOW',
  }));
}

// Format tide data for Vestaboard
function formatTideData(tides) {
  const sortedTides = tides.sort((a, b) => a.time - b.time).slice(0, 4);
  return sortedTides.map(tide => {
    const hours = tide.time.getHours();
    const minutes = tide.time.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${tide.type.padEnd(6)}${(hours % 12 || 12)}:${minutes} ${ampm} ${tide.value} FT`;
  });
}

// Main handler function for Vercel
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching tide data...');
    const tides = await fetchTideData();

    console.log('Formatting tide data...');
    const formattedTides = formatTideData(tides).join('\n');

    console.log('Sending tide data to Vestaboard...');
    const vesta = new VestaRW({ apiReadWriteKey: apiKey });
    await vesta.postMessage(formattedTides);

    res.status(200).json({ status: 'Success', message: 'Tides sent to Vestaboard!' });
  } catch (error) {
    console.error('Error sending tide data:', error.message);
    res.status(500).json({ error: error.message });
  }
}