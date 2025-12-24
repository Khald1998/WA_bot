// Unit test for parser_iban functionality
// This test validates the complete flow: delete IBAN -> validate chat -> collect evidence -> verify restoration

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const dbPath = path.join(__dirname, '../FPG.db');

async function runTest() {
    console.log('=== Starting IBAN Parser Integration Test ===\n');
    
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
    
    try {
        // Step 1: Pick a random FPG_logs_id from IBAN table
        console.log('Step 1: Picking random FPG_logs_id from IBAN table...');
        const randomIban = await new Promise((resolve, reject) => {
            db.get('SELECT FPG_logs_id, iban_number FROM IBAN ORDER BY RANDOM() LIMIT 1', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!randomIban) {
            console.log('No IBAN records found in database. Test aborted.');
            db.close();
            return;
        }
        
        const testFpgLogsId = randomIban.FPG_logs_id;
        const testIbanNumber = randomIban.iban_number;
        console.log(`Selected FPG_logs_id: ${testFpgLogsId}`);
        console.log(`IBAN Number: ${testIbanNumber}\n`);
        
        // Step 2: Delete from IBAN table
        console.log('Step 2: Deleting from IBAN table...');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM IBAN WHERE FPG_logs_id = ?', [testFpgLogsId], (err) => {
                if (err) reject(err);
                else {
                    console.log('Deleted from IBAN table ✓\n');
                    resolve();
                }
            });
        });
        
        // Step 3: Delete from FPG_logs table
        console.log('Step 3: Deleting from FPG_logs table...');
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM FPG_logs WHERE mid = ?', [testFpgLogsId], (err) => {
                if (err) reject(err);
                else {
                    console.log('Deleted from FPG_logs table ✓\n');
                    resolve();
                }
            });
        });
        
        db.close();
        
        // Step 4: Run validate_chat_completeness_request.js
        console.log('Step 4: Running validate_chat_completeness_request.js...');
        const validateResult = await execPromise('node /root/whatsapp-bot/HTTP_request/validate_chat_completeness_request.js');
        console.log(validateResult.stdout);
        if (validateResult.stderr) console.error(validateResult.stderr);
        console.log('');
        
        // Wait a moment for the database to be updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 5: Run collect_evidence_request.js
        console.log('Step 5: Running collect_evidence_request.js...');
        const collectResult = await execPromise('node /root/whatsapp-bot/HTTP_request/collect_evidence_request.js');
        console.log(collectResult.stdout);
        if (collectResult.stderr) console.error(collectResult.stderr);
        console.log('');
        
        // Wait a moment for the database to be updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Verify the value exists in the database again
        console.log('Step 6: Verifying restoration in database...');
        const dbVerify = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
        
        const restoredIban = await new Promise((resolve, reject) => {
            dbVerify.get('SELECT * FROM IBAN WHERE FPG_logs_id = ?', [testFpgLogsId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        const restoredLog = await new Promise((resolve, reject) => {
            dbVerify.get('SELECT * FROM FPG_logs WHERE mid = ?', [testFpgLogsId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        dbVerify.close();
        
        console.log('\n=== Test Results ===');
        console.log(`FPG_logs_id: ${testFpgLogsId}`);
        console.log(`Original IBAN: ${testIbanNumber}`);
        console.log(`FPG_logs restored: ${restoredLog ? '✓ YES' : '✗ NO'}`);
        console.log(`IBAN restored: ${restoredIban ? '✓ YES' : '✗ NO'}`);
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('Test failed with error:', error);
        db.close();
    }
}

runTest();
