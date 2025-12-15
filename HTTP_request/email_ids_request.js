
const axios = require('axios');

const now = new Date();
const start_time = new Date(now.setHours(0, 0, 0, 0)).toISOString();
const end_time = new Date(now.setHours(23, 59, 59, 999)).toISOString();

const email_config = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'alzahrani.khaled.98@gmail.com',
  pass: 'dycs nwqs uyvm hkay',
  from: 'alzahrani.khaled.98@gmail.com'
};

const data = {
  email_config,
  start_time,
  end_time,
  emails: ["arraaa1999@gmail.com", "aalasmari@saib.com.sa"]
};

axios.post('http://localhost:3000/email-national-id-csv', data)
  .then(res => {
    console.log('Email National ID CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email National ID CSV:', err.response ? err.response.data : err.message);
  });
