const axios = require('axios');

const now = new Date();
const startTime = new Date(now.setHours(0, 0, 0, 0)).toISOString();
const endTime = new Date(now.setHours(23, 59, 59, 999)).toISOString();

const data = {
  startTime,
  endTime,
  numbers: ["966580599359", "966538762235", "966530857472"]
// numbers: ["966580599359"]
};

axios.post('http://localhost:3000/send-national-id-csv', data)
  .then(res => {
    console.log('National ID CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending National ID CSV:', err.response ? err.response.data : err.message);
  });
