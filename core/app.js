const express = require('express');
const { create_whatsapp_client } = require('../services/whatsapp_client_service');
const send_api = require('../APIs/send_api');
const test_api = require('../APIs/test_api');
const { log_action } = require('../debug/logger');

const app = express();
app.use(express.json());


// Initialize the WhatsApp client with local authentication (moved to service)
const { client, get_client_ready } = create_whatsapp_client();
client.initialize();


// Mount the API router (paths are defined inside the API module)
log_action('SERVER_START', 'Mounting API router');
app.use(send_api(client, get_client_ready));
app.use(test_api);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  log_action('SERVER_LISTEN', `HTTP API listening on http://localhost:${port}`);
  console.log(`🚀 HTTP API listening on http://localhost:${port}`);
  console.log('   → POST /send   { "number": "<recipient>", "message": "<text>" }');
});
