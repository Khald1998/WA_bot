function generate_filename(prefix, start_time, end_time) {
  const sanitize = (t) => t.replace(/:/g, '-');
  return `${prefix}_${sanitize(start_time)}_to_${sanitize(end_time)}.csv`;
}

module.exports = generate_filename;
