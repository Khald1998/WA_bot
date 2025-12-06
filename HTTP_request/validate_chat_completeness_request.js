const axios = require('axios');

axios.post('http://localhost:3000/validate-chat-completeness')
  .then(res => {
    console.log('Validate chat completeness result:', res.data);
  })
  .catch(err => {
    console.error('Error validating chat completeness:', err.response ? err.response.data : err.message);
  });
