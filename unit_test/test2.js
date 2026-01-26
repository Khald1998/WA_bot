const text = `
سداد فاتورة
من:1716
مبلغ:SAR 5699
مفوتر:134
الخدمة:اكسترا
الفاتورة:10459031
في:25-12-17 21:29
`;

const match = text.match(/\b\d{8}\b/);

const invoiceNumber = match ? match[0] : null;

console.log(invoiceNumber); // 10459031
