const SERVICE_FILE_NAME = 'services/test_service.js';
const FUNCTION_NAME = 'get_test_response';
// Service to generate test response with a random number
function get_test_response() {
  const { log_action } = require('../debug/logger');
  const randomNumber = Math.floor(Math.random() * 10000); // random number 0-9999
    try {
      log_action('TEST_RESPONSE', `Generated random number: ${randomNumber}`);
      return {
        status: 'ok',
        message: `Test route working! (${randomNumber})`
      };
    } catch (error) {
      log_action('TEST_RESPONSE_ERROR', error.message);
      console.error('Error in get_test_response:', error);
      return { status: 'error', message: 'Error in test response.' };
    }
}

module.exports = { get_test_response };