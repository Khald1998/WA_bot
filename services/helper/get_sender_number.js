

async function get_sender_phone_number(client, message) {
    const contact = await client.getContactLidAndPhone(message.author);
    return contact[0].pn;
}

module.exports = { get_sender_phone_number };
