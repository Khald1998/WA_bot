function normalize_number(number) {
  return `${number.replace(/\D/g, '')}@c.us`;
}

module.exports = normalize_number;
