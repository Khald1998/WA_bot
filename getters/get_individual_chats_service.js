const SERVICE_FILE_NAME = 'getters/get_individual_chats_service.js';      // this module's path label for logging
const FUNCTION_NAME = 'get_individual_chats';      // this function's name label for logging
const { log_action } = require('../debug/logger');      // import the structured action logger

async function get_individual_chats(client) {      // fetch the list of one-to-one WhatsApp chats
  try {      // guard the async fetch against errors
    log_action('INDIVIDUAL_CHATS_ATTEMPT', 'Fetching individual chats');      // log that a fetch attempt is starting
    const chats = await client.getChats();      // retrieve all chats from the WhatsApp client
    const individual_chats = chats.filter(chat => !chat.isGroup);      // keep only chats that are not groups
    log_action('INDIVIDUAL_CHATS_SUCCESS', `Found ${individual_chats.length} individual chats`);      // log how many individual chats were found
    return individual_chats.map(chat => ({      // map each chat to a small id/name summary object
      id: chat.id._serialized,      // the chat's serialized WhatsApp id
      name: chat.name || chat.id.user      // the contact name, falling back to the phone user part
    }));      // end the map projection and return the array
  } catch (error) {      // handle any failure during the fetch
    log_action('INDIVIDUAL_CHATS_ERROR', error.message);      // log the error message
    return [];      // return an empty list on failure
  }      // end the try/catch
}      // end the get_individual_chats function

module.exports = {      // export the module's public API
  get_individual_chats      // expose the get_individual_chats function
};      // end the exports object
