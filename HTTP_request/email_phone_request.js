const axios = require('axios');

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const start_time = new Date(yesterday.setHours(0,0,0,0)).toISOString();
const end_time = new Date(yesterday.setHours(23,59,59,999)).toISOString();

const email_config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'your-email@gmail.com',
  pass: 'your-app-password',
  from: 'your-email@gmail.com'
};

const data = {
  email_config,
  start_time,
  end_time,
  emails: ["recipient1@example.com", "recipient2@example.com"]
};

axios.post('http://localhost:3000/email-phone-csv', data)
  .then(res => {
    console.log('Email Phone CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email Phone CSV:', err.response ? err.response.data : err.message);
  });
