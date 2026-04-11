const axios = require('axios');
const email_config = require('./email_config');

const data = {
  email_config,
  to: [
    "Tbinessa@saib.com.sa",
    "Alhajoojs@saib.com.sa",
    "Hajajalmutairi@saib.com.sa",
    "Aalawn@saib.com.sa",
    "Aalsuwayri@saib.com.sa",
    "kalzahrani@saib.com.sa",
    "h.almutairi@saib.com.sa",
    "abdulazizalrayes@saib.com.sa",
    "a.alshebl@saib.com.sa",
    "m.alanazi@saib.com.sa",
    "oalharbi@saib.com.sa"
  ],
  cc: [
    "aalasmari@saib.com.sa",
    "Analshammari@saib.com.sa",
    "Alharbif@saib.com.sa"
  ]
};

axios.post('http://localhost:3000/email-sadad-raw', data)
  .then(res => {
    console.log('Email SADAD Raw sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email SADAD Raw:', err.response ? err.response.data : err.message);
  });
