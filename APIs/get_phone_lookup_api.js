const express = require('express');  // load the Express web framework
const router = express.Router();  // create a new Express router instance
const { log_action } = require('../debug/logger');  // pull in the structured action logger
const phone_lookup = require('../db/getters/phone_lookup');  // load the batch phone enrichment getter

const guard = (res, err_label, work) => work().catch(err => {  // run a route body, funnelling any failure through one shared error path
    log_action('API_PHONE_LOOKUP_ERROR', err.message);  // log the error message via the action logger
    res.status(500).json({ error: err_label, details: err.message });  // respond 500 with this route's label plus the error details
});  // end guard helper

module.exports = () => {  // export a factory that builds and returns the router
    router.post('/phones/lookup', (req, res) => {  // handle POST /phones/lookup batch lookups (body: {"numbers":[...]})
        const numbers = req.body && req.body.numbers;  // read the numbers array from the JSON body
        if (!Array.isArray(numbers)) return res.status(400).json({ error: 'Provide a "numbers" array in the JSON body.' });  // require an array; an empty array is allowed and yields {} (an empty lookup is not an error)
        return guard(res, 'Failed to look up phones.', async () => {  // enrich the batch, funnelling any error to the shared handler
            log_action('API_PHONE_LOOKUP_ATTEMPT', `count: ${numbers.length}`);  // log the batch attempt
            const results = await phone_lookup(numbers);  // enrich every requested number in one query, keyed by the exact input string
            log_action('API_PHONE_LOOKUP_SUCCESS', `count: ${numbers.length}`);  // log the outcome
            res.json(results);  // return the object keyed by the caller's input number
        });  // end batch work
    });  // end POST /phones/lookup route

    router.get('/phones/:number', (req, res) => {  // handle GET /phones/<number> single enriched lookups
        const { number } = req.params;  // read the requested number exactly as given in the path
        return guard(res, 'Failed to look up phone.', async () => {  // enrich the single number, funnelling any error to the shared handler
            log_action('API_PHONE_LOOKUP_ATTEMPT', `number: ${number}`);  // log the lookup attempt
            const record = (await phone_lookup(number))[number];  // enrich the single number (getter accepts a bare string) and pull its record from the keyed result
            log_action('API_PHONE_LOOKUP_SUCCESS', `number: ${number}, exists: ${record.exists}`);  // log the outcome
            res.json({ number, ...record });  // return the number as given plus its enriched record
        });  // end single-number work
    });  // end GET /phones/:number route

    return router;  // return the configured router
};  // end exported factory
