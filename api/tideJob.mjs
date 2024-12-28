import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Fetch tide data (reuse the fetchTideData logic)
  try {
    const tides = await fetchTideData();
    const formattedTides = formatTideData(tides);
    const output = formattedTides.join('\n');

    // Write the file in the current directory
    const filePath = path.join(process.cwd(), 'tideData.txt');
    fs.writeFileSync(filePath, output, 'utf8');

    res.status(200).send('Tide data written successfully');
  } catch (error) {
    console.error('Error writing tide data:', error.message);
    res.status(500).send('Error writing tide data');
  }
}

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
  return data.predictions;
}

function formatTideData(tides) {
  return tides
    .map(tide => ({
      time: new Date(tide.t),
      value: parseFloat(tide.v).toFixed(1),
      type: tide.type === 'H' ? 'HIGH' : 'LOW',
    }))
    .sort((a, b) => a.time - b.time)
    .slice(0, 4)
    .map(tide => {
      const hours = tide.time.getHours();
      const minutes = tide.time.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      return `${tide.type.padEnd(6, ' ')}${(hours % 12 || 12).toString().padStart(2, ' ')}:${minutes} ${ampm} ${tide.value.padStart(5, ' ')} FT`;
    });
}