const path = require('path');

function build_attachment(file_name, file_content) {
  const extension = path.extname(file_name).toLowerCase();

  if (extension === '.csv') {
    const bom = Buffer.from('\uFEFF', 'utf-8');
    const csv = Buffer.from(file_content, 'utf-8');
    return {
      filename: file_name,
      content: Buffer.concat([bom, csv]),
      contentType: 'text/csv; charset=utf-8',
    };
  }

  if (extension === '.txt') {
    return {
      filename: file_name,
      content: Buffer.from(file_content, 'utf-8'),
      contentType: 'text/plain; charset=utf-8',
    };
  }

  if (extension === '.json') {
    return {
      filename: file_name,
      content: Buffer.from(file_content, 'utf-8'),
      contentType: 'application/json; charset=utf-8',
    };
  }

  if (extension === '.pdf') {
    return {
      filename: file_name,
      content: file_content,
      contentType: 'application/pdf',
    };
  }

  if (extension === '.xlsx') {
    return {
      filename: file_name,
      content: file_content,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  if (extension === '.png') {
    return {
      filename: file_name,
      content: file_content,
      contentType: 'image/png',
    };
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return {
      filename: file_name,
      content: file_content,
      contentType: 'image/jpeg',
    };
  }

  return {
    filename: file_name,
    content: file_content,
    contentType: 'application/octet-stream',
  };
}

module.exports = build_attachment;