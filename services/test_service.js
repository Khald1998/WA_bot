// Service to generate test response with a random number
function get_test_response() {
  const randomNumber = Math.floor(Math.random() * 10000); // random number 0-9999
  return {
    status: 'ok',
    message: `Test route working! (${randomNumber})`
  };
}

module.exports = { get_test_response };