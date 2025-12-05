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
        const whatsappMessages = await get_all_group_chat_history(GROUP_ID, client);
        log_action('VALIDATE_CHAT_COMPLETENESS_FETCHED', `Total WhatsApp messages: ${whatsappMessages.length}`);
        
        // Step 2: Get all existing messages from database
        console.log('Fetching all database logs...');
        const dbMessages = await new Promise((resolve, reject) => {
            get_all_FPG_logs((err, logs) => {
                if (err) reject(err);
                else resolve(logs);
            });
        });
        log_action('VALIDATE_CHAT_COMPLETENESS_DB_LOGS', `Total DB messages: ${dbMessages.length}`);
        
        // Step 3: Create a Set of existing _serialized IDs in the database
        const existingSerializedIds = new Set(
            dbMessages.map(msg => msg._serialized)
        );
        
        // Step 4: Filter messages that don't exist in the database
        const missingMessages = whatsappMessages.filter(
            msg => !existingSerializedIds.has(msg.id._serialized)
        );
        
        console.log(`Found ${missingMessages.length} missing messages to insert`);
        log_action('VALIDATE_CHAT_COMPLETENESS_MISSING', `Missing messages: ${missingMessages.length}`);
        
        // Step 5: Insert missing messages
        let insertedCount = 0;
        let errorCount = 0;
        
        for (const message of missingMessages) {
            try {
                // Get phone number for the message
                const phoneNumber = await get_sender_phone_number(client, message);
                
                // Collect message data
                const db_message = collect_db_message(message, phoneNumber);
                
                if (db_message) {
                    // Download media if present and set media_id
                    db_message.media_id = await download_media(client, message);
                    
                    // Insert message into database
                    insert_message(db_message);
                    insertedCount++;
                    
                    if (insertedCount % 10 === 0) {
                        console.log(`Inserted ${insertedCount}/${missingMessages.length} messages...`);
                    }
                }
            } catch (error) {
                errorCount++;
                log_action('VALIDATE_CHAT_COMPLETENESS_INSERT_ERROR', 
                    `Error inserting message ${message.id._serialized}: ${error.message}`);
                console.error(`Error inserting message ${message.id._serialized}:`, error.message);
            }
        }
        
        console.log(`Validation complete! Inserted: ${insertedCount}, Errors: ${errorCount}`);
        log_action('VALIDATE_CHAT_COMPLETENESS_COMPLETE', 
            `Inserted: ${insertedCount}, Errors: ${errorCount}`);
        
        return {
            totalWhatsAppMessages: whatsappMessages.length,
            totalDbMessages: dbMessages.length,
            missingMessages: missingMessages.length,
            insertedCount,
            errorCount
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
