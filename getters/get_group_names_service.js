const { log_action } = require('../debug/logger');      // import the structured action logger

async function get_group_names(client) {      // fetch the list of WhatsApp group chats for the client
  try {      // guard the async fetch against errors
    log_action('GROUP_NAMES_ATTEMPT', 'Fetching group chats');      // log that a fetch attempt is starting
    const chats = await client.getChats();      // retrieve all chats from the WhatsApp client
    const group_chats = chats.filter(chat => chat.isGroup);      // keep only chats that are groups
    log_action('GROUP_NAMES_SUCCESS', `Found ${group_chats.length} group chats`);      // log how many group chats were found
    return group_chats.map(group => ({      // map each group to a small id/name summary object
      id: group.id._serialized,      // the group's serialized WhatsApp id
      name: group.name      // the group's display name
    }));      // end the map projection and return the array
    } catch (error) {      // handle any failure during the fetch
      log_action('GROUP_NAMES_ERROR', error.message);      // log the error message
      return [];      // return an empty list on failure
  }      // end the try/catch
}      // end the get_group_names function

module.exports = {      // export the module's public API
  get_group_names      // expose the get_group_names function
};      // end the exports object
