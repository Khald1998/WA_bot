const axios = require('axios');

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

axios.post('http://localhost:3000/email-iban-raw', data)
  .then(res => {
    console.log('Email IBAN Raw sent:', res.data);
  })
  .catch(err => {
    console.error('Error sending Email IBAN Raw:', err.response ? err.response.data : err.message);
  });
