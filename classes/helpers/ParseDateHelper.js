module.exports = (input) => {
    // Transform date from text to date
  var parts = input.match(/(\d+)/g);
  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2]) > new Date ? new Date : new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}