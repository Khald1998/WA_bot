function build_attachment(file_name, csv_content) {
  return {
    filename: file_name,
    content: csv_content,
    contentType: 'text/csv'
  };
}

module.exports = build_attachment;
