const { MessageMedia } = require('whatsapp-web.js');

function create_csv_media(csv_content, file_name) {
  const base64_data = Buffer.from(csv_content, 'utf-8').toString('base64');
  return new MessageMedia('text/csv', base64_data, file_name);
}

module.exports = create_csv_media;
