const axios = require('axios');

const apiKey = 'x3bfuFo8SLrsROdFMFKCqw==j4PxISUtIIFhXWf8';


async function fetchRiddle() {
  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/riddles', {
      headers: { 'X-Api-Key': apiKey }
    });
    return response.data[0];
  } catch (error) {
    console.error('Riddle API error:', error);
    return null;
  }
}

module.exports = { fetchRiddle };