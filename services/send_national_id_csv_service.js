const service_file_name = 'services/send_national_id_csv_service.js';
const function_name = 'send_national_id_csv_service';

const { log_action } = require('../debug/logger');
const open_database = require('./helper/open_database');
const escape_csv_field = require('./helper/escape_csv_field');
const create_csv_media = require('./helper/create_csv_media');
const send_to_all_numbers = require('./helper/send_to_all_numbers');

function query_national_ids(db, start_time, end_time) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at
      FROM national_id
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at ASC
    `;
    db.all(query, [start_time, end_time], (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });
}

function national_id_to_csv_row(record) {
  return [
    record.id,
    record.FPG_logs_id,
    escape_csv_field(record.national_id_number),
    escape_csv_field(record.original_text),
    record.created_at,
    record.updated_at
  ].join(',');
}

function convert_to_csv(records) {
  const header = 'id,FPG_logs_id,national_id_number,original_text,created_at,updated_at';
  const rows = records.map(national_id_to_csv_row);
  return [header, ...rows].join('\n');
}

function generate_filename(start_time, end_time) {
  const sanitize = (t) => t.replace(/:/g, '-');
  return `national_ids_${sanitize(start_time)}_to_${sanitize(end_time)}.csv`;
}

function build_caption(start_time, end_time, count) {
  return `National IDs Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${count}`;
}

async function send_national_id_csv_service(client, start_time, end_time, numbers) {
  const db = open_database();

  try {
    log_action('NATIONAL_ID_CSV_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);

    const national_ids = await query_national_ids(db, start_time, end_time);
    log_action('NATIONAL_ID_CSV_QUERY_SUCCESS', `Found ${national_ids.length} national IDs`);

    if (national_ids.length === 0) {
      log_action('NATIONAL_ID_CSV_NO_DATA', 'No national IDs found in the specified time range');
      return { success: false, message: 'No national IDs found in the specified time range' };
    }

    const csv_content = convert_to_csv(national_ids);
    log_action('NATIONAL_ID_CSV_GENERATED', `CSV size: ${csv_content.length} bytes`);

    const file_name = generate_filename(start_time, end_time);
    const media = create_csv_media(csv_content, file_name);
    const caption = build_caption(start_time, end_time, national_ids.length);

    const results = await send_to_all_numbers(client, media, numbers, caption, log_action, 'NATIONAL_ID_CSV');

    return {
      success: true,
      file_name,
      record_count: national_ids.length,
      sent_to: results
    };

  } catch (err) {
    log_action('NATIONAL_ID_CSV_ERROR', `error: ${err.message}`);
    throw err;
  } finally {
    db.close();
  }
}

module.exports = { send_national_id_csv_service };