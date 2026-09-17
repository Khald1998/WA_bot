require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });  // load environment variables from the project .env

// Initialize database and create tables if they don't exist
require('../db/database');  // initialize the database and create tables

const express = require('express');  // load the Express web framework
const { create_whatsapp_client } = require('../services/whatsapp_client_service');  // load the WhatsApp client factory
const get_group_names_api = require('../APIs/get_group_names_api');  // load the group-names API route
const { log_action } = require('../debug/logger');  // load the action logger
const attach_message_listener = require('../services/message_listener_service');  // load the incoming-message listener
const get_individual_chats_api = require('../APIs/get_individual_chats_api');  // load the individual-chats API route
const email_csv_iban_api = require('../APIs/email_csv_iban_api');  // load the IBAN CSV email API route
const email_csv_sadad_api = require('../APIs/email_csv_sadad_api');  // load the SADAD CSV email API route
const email_csv_national_id_api = require('../APIs/email_csv_national_id_api');  // load the national-ID CSV email API route
const email_raw_national_id_api = require('../APIs/email_raw_national_id_api');  // load the raw national-ID email API route
const email_raw_iban_api = require('../APIs/email_raw_iban_api');  // load the raw IBAN email API route
const email_raw_sadad_api = require('../APIs/email_raw_sadad_api');  // load the raw SADAD email API route
const get_phones_api = require('../APIs/get_phones_api');  // load the phones API route
const get_all_phones_api = require('../APIs/get_all_phones_api');  // load the all-phones API route
const get_sadads_api = require('../APIs/get_sadads_api');  // load the SADAD listing API route

const app = express();  // create the Express application
app.use(express.json());  // parse JSON request bodies



// Initialize the WhatsApp client with local authentication (moved to service)
const { client, get_client_ready } = create_whatsapp_client();  // build the WhatsApp client and readiness getter
client.initialize();  // start the WhatsApp client session

// Attach message listener
attach_message_listener(client);  // wire the message listener to the client


// Mount the API router (paths are defined inside the API module)
log_action('SERVER_START', 'Mounting API router');  // log that API routes are being mounted
app.use(get_group_names_api(client, get_client_ready));  // mount the group-names route
app.use(get_individual_chats_api(client, get_client_ready));  // mount the individual-chats route
app.use(email_csv_iban_api());  // mount the IBAN CSV email route
app.use(email_csv_sadad_api());  // mount the SADAD CSV email route
app.use(email_csv_national_id_api());  // mount the national-ID CSV email route
app.use(email_raw_national_id_api());  // mount the raw national-ID email route
app.use(email_raw_iban_api());  // mount the raw IBAN email route
app.use(email_raw_sadad_api());  // mount the raw SADAD email route
app.use(get_phones_api());  // mount the phones route
app.use(get_all_phones_api());  // mount the all-phones route
app.use(get_sadads_api());  // mount the SADAD listing route

const port = process.env.PORT || 3000;  // resolve the listen port, default 3000
app.listen(port, () => {  // start the HTTP server
  log_action('SERVER_LISTEN', `HTTP API listening on http://localhost:${port}`);  // log that the server is listening
  console.log(`🚀 HTTP API listening on http://localhost:${port}`);  // print the listening banner
  console.log('   → GET  /groups');  // print the /groups route hint
  console.log('   → POST /archive_chat          { "group_id": "<group_id>" }');  // print the /archive_chat route hint
  console.log('   → POST /last_message_in_group   { "group_id": "<group_id>" }');  // print the /last_message_in_group route hint
  console.log('   → POST /message_count_in_group  { "group_id": "<group_id>" }');  // print the /message_count_in_group route hint
  console.log('   → POST /email-csv-iban          { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>", "text_body": "<text>", "html_body": "<html>" }');  // print the /email-csv-iban route hint
  console.log('   → POST /email-csv-sadad         { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>", "text_body": "<text>", "html_body": "<html>" }');  // print the /email-csv-sadad route hint
  console.log('   → POST /email-csv-national-id   { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>", "text_body": "<text>", "html_body": "<html>" }');  // print the /email-csv-national-id route hint
  console.log('   → POST /email-raw-national-id   { "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>" }');  // print the /email-raw-national-id route hint
  console.log('   → POST /email-raw-sadad         { "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>" }');  // print the /email-raw-sadad route hint
});  // end listen callback
