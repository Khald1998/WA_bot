const express = require('express');
const { create_whatsapp_client } = require('../services/whatsapp_client_service');
const send_message_api = require('../APIs/send_message_api');
const test_api = require('../APIs/test_api');
const get_group_names_api = require('../APIs/get_group_names_api');
const { log_action } = require('../debug/logger');
const attach_message_listener = require('../services/message_listener_service');
const archive_chat_api = require('../APIs/archive_chat_api');
const get_individual_chats_api = require('../APIs/get_individual_chats_api');
const last_message_in_group_api = require('../APIs/last_message_in_group_api');
const message_count_in_group_api = require('../APIs/message_count_in_group_api');

const app = express();
app.use(express.json());



// Initialize the WhatsApp client with local authentication (moved to service)
const { client, get_client_ready } = create_whatsapp_client();
client.initialize();

// Attach message listener
attach_message_listener(client);


// Mount the API router (paths are defined inside the API module)
log_action('SERVER_START', 'Mounting API router');
app.use(send_message_api(client, get_client_ready));
app.use(test_api);
app.use(get_group_names_api(client, get_client_ready));
app.use(archive_chat_api(client, get_client_ready));
app.use(get_individual_chats_api(client, get_client_ready));
app.use(last_message_in_group_api(client, get_client_ready));
app.use(message_count_in_group_api(client, get_client_ready));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  log_action('SERVER_LISTEN', `HTTP API listening on http://localhost:${port}`);
  console.log(`🚀 HTTP API listening on http://localhost:${port}`);
  console.log('   → POST /send                 { "number": "<recipient>", "message": "<text>" }');
  console.log('   → GET  /test');
  console.log('   → GET  /groups');
  console.log('   → POST /archive_chat          { "group_id": "<group_id>" }');
  console.log('   → POST /last_message_in_group   { "group_id": "<group_id>" }');
  console.log('   → POST /message_count_in_group  { "group_id": "<group_id>" }');
});
