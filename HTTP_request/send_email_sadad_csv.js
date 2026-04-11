const axios = require('axios');
const email_config = require('./email_config');

const start_time = '1970-01-01T00:00:00.000Z';
const end_time = '9999-12-31T23:59:59.999Z';

const data = {
  type: 'sadad',
  email_config,
  start_time,
  end_time,
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

axios.post('http://localhost:3000/email-csv', data)
  .then(res => {
    console.log('Email SADAD CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email SADAD CSV:', err.response ? err.response.data : err.message);
  });
