const axios = require('axios');

axios.post('http://localhost:3000/collect-evidence')
  .then(res => {
    console.log('Collect evidence result:', res.data);
  })
  .catch(err => {
    console.error('Error collecting evidence:', err.response ? err.response.data : err.message);
  });
