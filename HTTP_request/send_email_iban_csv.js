const axios = require('axios');



const start_time = '1970-01-01T00:00:00.000Z';
const end_time = '9999-12-31T23:59:59.999Z';

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
  to: [
    "Tbinessa@saib.com.sa",
    "Alhajoojs@saib.com.sa",
    "Hajajalmutairi@saib.com.sa",
    "Aalawn@saib.com.sa",
    "Aalsuwayri@saib.com.sa",
    "kalzahrani@saib.com.sa",
    "h.almutairi@saib.com.sa"
  ],
  cc: [
    "aalasmari@saib.com.sa",
    "Analshammari@saib.com.sa",
    "Alharbif@saib.com.sa"
  ]
};

axios.post('http://localhost:3000/email-iban-csv', data)
  .then(res => {
    console.log('Email IBAN CSV sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email IBAN CSV:', err.response ? err.response.data : err.message);
  });
