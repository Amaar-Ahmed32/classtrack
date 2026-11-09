// Date helpers. Attendance is date-based, not timestamp-based, so every date
// is normalized to local midnight before it touches the database.
function startOfDay(input) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(input) {
  const d = startOfDay(input);
  d.setDate(d.getDate() + 1);
  return d;
}

// Returns [firstMoment, lastMoment) covering a whole "YYYY-MM" month.
function monthRange(month) {
  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  return [start, end];
}

module.exports = { startOfDay, endOfDay, monthRange };
