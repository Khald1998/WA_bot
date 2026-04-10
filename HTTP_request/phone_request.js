const axios = require('axios');

const now = new Date();
const start_time = new Date(now.setHours(0, 0, 0, 0)).toISOString();
const end_time = new Date(now.setHours(23, 59, 59, 999)).toISOString();

const data = {
  start_time,
  end_time,
  numbers: ["966580599359", "966538762235", "966530857472"]
// numbers: ["966580599359"]
};

axios.post('http://localhost:3000/send-phone-csv', data)
  .then(res => {
    console.log('Phone CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Phone CSV:', err.response ? err.response.data : err.message);
  });
