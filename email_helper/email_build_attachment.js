function build_attachment(file_name, csv_content) {
  return {
    filename: file_name,
    content: Buffer.concat([Buffer.from('\uFEFF', 'utf-8'), Buffer.from(csv_content, 'utf-8')]),
    contentType: 'text/csv; charset=utf-8'
  };
}

module.exports = build_attachment;
