// Minimal CSV parser for roster import — no dependency needed.
// Handles: quoted fields ("Ali, Jr."), CRLF line endings, blank lines.
// Expected columns (header row, case-insensitive): name, rollNo, parentName, parentPhone.
// Returns { students: [...], errors: [...] } — bad rows are reported, never silently dropped.
function splitLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; // escaped quote
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[\s_-]/g, '');
}

function parseRosterCSV(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim() !== '');
  const students = [];
  const errors = [];
  if (lines.length === 0) return { students, errors: ['CSV is empty'] };

  const headers = splitLine(lines[0]).map(normalizeHeader);
  const hasHeader = headers.includes('name') || headers.includes('rollno');
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const colIndex = (wanted) => (hasHeader ? headers.indexOf(wanted) : null);

  dataLines.forEach((line, i) => {
    const fields = splitLine(line);
    const pick = (wanted, fallbackPos) => {
      const idx = colIndex(wanted);
      return (idx !== null && idx >= 0 ? fields[idx] : fields[fallbackPos]) || '';
    };
    const row = {
      name: pick('name', 0),
      rollNo: pick('rollno', 1),
      parentName: pick('parentname', 2),
      parentPhone: pick('parentphone', 3),
    };
    if (!row.name || !row.rollNo) {
      errors.push(`Row ${i + (hasHeader ? 2 : 1)}: missing name or rollNo — skipped`);
    } else {
      students.push(row);
    }
  });
  return { students, errors };
}

module.exports = { parseRosterCSV };
