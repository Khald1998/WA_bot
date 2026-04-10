// services/validate_chat_completeness.js
// Service to validate and insert missing chat messages from WhatsApp group into the database

const { get_all_group_chat_history } = require('./get_group_chat_history_service');
const get_all_FPG_logs = require('../db/utility/get_all_FPG_logs');
const insert_message = require('../db/utility/insert_message');
const collect_db_message = require('./helper/collect_db_message');
const { get_sender_phone_number } = require('./helper/get_sender_number');
const { download_media } = require('./download_media_service');
const { log_action } = require('../debug/logger');

const GROUP_ID = '120363199265021169@g.us';

async function validate_chat_completeness(client) {
    try {
        log_action('VALIDATE_CHAT_COMPLETENESS_START', `group_id: ${GROUP_ID}`);
        
        // Step 1: Get all messages from WhatsApp group
        console.log('Fetching all group chat history...');
        const whatsapp_messages = await get_all_group_chat_history(GROUP_ID, client);
        log_action('VALIDATE_CHAT_COMPLETENESS_FETCHED', `Total WhatsApp messages: ${whatsapp_messages.length}`);
        
        // Step 2: Get all existing messages from database
        console.log('Fetching all database logs...');
        const db_messages = await new Promise((resolve, reject) => {
            get_all_FPG_logs((err, logs) => {
                if (err) reject(err);
                else resolve(logs);
            });
        });
        log_action('VALIDATE_CHAT_COMPLETENESS_DB_LOGS', `Total DB messages: ${db_messages.length}`);
        
        // Step 3: Create a Set of existing _serialized IDs in the database
        const existing_serialized_ids = new Set(
            db_messages.map(msg => msg._serialized)
        );
        
        // Step 4: Filter messages that don't exist in the database
        const missing_messages = whatsapp_messages.filter(
            msg => !existing_serialized_ids.has(msg.id._serialized)
        );
        
        console.log(`Found ${missing_messages.length} missing messages to insert`);
        log_action('VALIDATE_CHAT_COMPLETENESS_MISSING', `Missing messages: ${missing_messages.length}`);
        
        // Step 5: Insert missing messages
        let inserted_count = 0;
        let error_count = 0;
        
        for (const message of missing_messages) {
            try {
                // Get phone number for the message
                const phone_number = await get_sender_phone_number(client, message);
                
                // Collect message data
                const db_message = collect_db_message(message, phone_number);
                
                if (db_message) {
                    // Download media if present and set media_id
                    db_message.media_id = await download_media(client, message);
                    
                    // Insert message into database
                    insert_message(db_message);
                    inserted_count++;
                    
                    if (inserted_count % 10 === 0) {
                        console.log(`Inserted ${inserted_count}/${missing_messages.length} messages...`);
                    }
                }
            } catch (error) {
                error_count++;
                log_action('VALIDATE_CHAT_COMPLETENESS_INSERT_ERROR', 
                    `Error inserting message ${message.id._serialized}: ${error.message}`);
                console.error(`Error inserting message ${message.id._serialized}:`, error.message);
            }
        }
        
        console.log(`Validation complete! Inserted: ${inserted_count}, Errors: ${error_count}`);
        log_action('VALIDATE_CHAT_COMPLETENESS_COMPLETE', 
            `Inserted: ${inserted_count}, Errors: ${error_count}`);
        
        return {
            total_whatsapp_messages: whatsapp_messages.length,
            total_db_messages: db_messages.length,
            missing_messages: missing_messages.length,
            inserted_count,
            error_count
        };
        
    } catch (error) {
        log_action('VALIDATE_CHAT_COMPLETENESS_ERROR', error.message);
        console.error('Error in validate_chat_completeness:', error);
        throw error;
    }
}

module.exports = {
    validate_chat_completeness
};
