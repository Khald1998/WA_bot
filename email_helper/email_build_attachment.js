const path = require('path');  // Node path helpers for reading the file extension

function build_attachment(file_name, file_content) {  // build a nodemailer attachment object from a name and content
  const extension = path.extname(file_name).toLowerCase();  // lowercase file extension to switch on

  if (extension === '.csv') {  // handle CSV files
    const bom = Buffer.from('\uFEFF', 'utf-8');  // UTF-8 byte-order mark so Excel reads Arabic correctly
    const csv = Buffer.from(file_content, 'utf-8');  // encode the CSV text as a UTF-8 buffer
    return {  // return the CSV attachment descriptor
      filename: file_name,  // attachment file name
      content: Buffer.concat([bom, csv]),  // BOM prepended to the CSV content
      contentType: 'text/csv; charset=utf-8',  // MIME type for a UTF-8 CSV
    };  // end CSV attachment object
  }  // end CSV branch

  if (extension === '.txt') {  // handle plain-text files
    return {  // return the text attachment descriptor
      filename: file_name,  // attachment file name
      content: Buffer.from(file_content, 'utf-8'),  // encode the text as a UTF-8 buffer
      contentType: 'text/plain; charset=utf-8',  // MIME type for UTF-8 plain text
    };  // end text attachment object
  }  // end text branch

  if (extension === '.json') {  // handle JSON files
    return {  // return the JSON attachment descriptor
      filename: file_name,  // attachment file name
      content: Buffer.from(file_content, 'utf-8'),  // encode the JSON text as a UTF-8 buffer
      contentType: 'application/json; charset=utf-8',  // MIME type for UTF-8 JSON
    };  // end JSON attachment object
  }  // end JSON branch

  if (extension === '.pdf') {  // handle PDF files
    return {  // return the PDF attachment descriptor
      filename: file_name,  // attachment file name
      content: file_content,  // raw PDF content passed through as-is
      contentType: 'application/pdf',  // MIME type for PDF
    };  // end PDF attachment object
  }  // end PDF branch

  if (extension === '.xlsx') {  // handle Excel .xlsx files
    return {  // return the xlsx attachment descriptor
      filename: file_name,  // attachment file name
      content: file_content,  // raw xlsx content passed through as-is
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // MIME type for an .xlsx workbook
    };  // end xlsx attachment object
  }  // end xlsx branch

  if (extension === '.png') {  // handle PNG images
    return {  // return the PNG attachment descriptor
      filename: file_name,  // attachment file name
      content: file_content,  // raw PNG bytes passed through as-is
      contentType: 'image/png',  // MIME type for PNG
    };  // end PNG attachment object
  }  // end PNG branch

  if (extension === '.jpg' || extension === '.jpeg') {  // handle JPEG images
    return {  // return the JPEG attachment descriptor
      filename: file_name,  // attachment file name
      content: file_content,  // raw JPEG bytes passed through as-is
      contentType: 'image/jpeg',  // MIME type for JPEG
    };  // end JPEG attachment object
  }  // end JPEG branch

  return {  // fallback attachment descriptor for unknown extensions
    filename: file_name,  // attachment file name
    content: file_content,  // raw content passed through as-is
    contentType: 'application/octet-stream',  // generic binary MIME type
  };  // end fallback attachment object
}  // end build_attachment function

module.exports = build_attachment;  // export the attachment builder