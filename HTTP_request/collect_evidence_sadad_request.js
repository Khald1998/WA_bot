const axios = require('axios');

axios.post('http://localhost:3000/collect-evidence-sadad')
  .then(res => {
    console.log('Collect SADAD evidence result:', res.data);
  })
  .catch(err => {
    console.error('Error collecting SADAD evidence:', err.response ? err.response.data : err.message);
  });
