require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize database and create tables if they don't exist
require('../db/database');

const express = require('express');
const { create_whatsapp_client } = require('../services/whatsapp_client_service');
const get_group_names_api = require('../APIs/get_group_names_api');
const { log_action } = require('../debug/logger');
const attach_message_listener = require('../services/message_listener_service');
const get_individual_chats_api = require('../APIs/get_individual_chats_api');
const get_group_chat_history_api = require('../APIs/get_group_chat_history_api');
const validate_chat_completeness_api = require('../APIs/validate_chat_completeness_api');
const collect_evidence_api = require('../APIs/collect_evidence_api');
const email_csv_iban_api = require('../APIs/email_csv_iban_api');
const email_csv_phone_api = require('../APIs/email_csv_phone_api');
const email_csv_sadad_api = require('../APIs/email_csv_sadad_api');
const email_csv_national_id_api = require('../APIs/email_csv_national_id_api');
const email_raw_iban_api = require('../APIs/email_raw_iban_api');
const email_raw_national_id_api = require('../APIs/email_raw_national_id_api');
const email_raw_sadad_api = require('../APIs/email_raw_sadad_api');

const app = express();
app.use(express.json());



// Initialize the WhatsApp client with local authentication (moved to service)
const { client, get_client_ready } = create_whatsapp_client();
client.initialize();

// Attach message listener
attach_message_listener(client);


// Mount the API router (paths are defined inside the API module)
log_action('SERVER_START', 'Mounting API router');
app.use(get_group_names_api(client, get_client_ready));
app.use(get_individual_chats_api(client, get_client_ready));
app.use(get_group_chat_history_api(client, get_client_ready));
app.use(validate_chat_completeness_api(client, get_client_ready));
app.use(collect_evidence_api);
app.use(email_csv_iban_api());
app.use(email_csv_phone_api());
app.use(email_csv_sadad_api());
app.use(email_csv_national_id_api());
app.use(email_raw_iban_api());
app.use(email_raw_national_id_api());
app.use(email_raw_sadad_api());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  log_action('SERVER_LISTEN', `HTTP API listening on http://localhost:${port}`);
  console.log(`🚀 HTTP API listening on http://localhost:${port}`);
  console.log('   → GET  /groups');
  console.log('   → POST /archive_chat          { "group_id": "<group_id>" }');
  console.log('   → POST /last_message_in_group   { "group_id": "<group_id>" }');
  console.log('   → POST /message_count_in_group  { "group_id": "<group_id>" }');
  console.log('   → GET  /group-chat-history/:group_id');
  console.log('   → POST /validate-chat-completeness');
  console.log('   → POST /email-csv-iban          { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "subject": "<subject>" }');
  console.log('   → POST /email-csv-phone         { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "subject": "<subject>" }');
  console.log('   → POST /email-csv-sadad         { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "subject": "<subject>" }');
  console.log('   → POST /email-csv-national-id   { "start_time": "<ISO_datetime>", "end_time": "<ISO_datetime>", "to": ["<email>", ...], "subject": "<subject>" }');
  console.log('   → POST /email-raw-iban          { "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>", "text_body": "<text>", "html_body": "<html>" }');
  console.log('   → POST /email-raw-national-id   { "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>", "text_body": "<text>", "html_body": "<html>" }');
  console.log('   → POST /email-raw-sadad         { "to": ["<email>", ...], "cc": ["<email>", ...], "subject": "<subject>", "text_body": "<text>", "html_body": "<html>" }');
});
