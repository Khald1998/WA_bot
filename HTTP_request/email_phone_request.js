const axios = require('axios');

const now = new Date();
const start_time = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const end_time = now.toISOString();

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

axios.post('http://localhost:3000/email-phone-csv', data)
  .then(res => {
    console.log('Email Phone CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email Phone CSV:', err.response ? err.response.data : err.message);
  });
