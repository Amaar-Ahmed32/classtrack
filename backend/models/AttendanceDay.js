// AttendanceDay — one document per class per day. The whole day's register
// lives in `records`, so marking attendance is a single upsert and the monthly
// register view is a simple range query. `date` is always normalized to midnight
// (see utils/dates.js) so "same day" can never mean two different timestamps.
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['P', 'A', 'L'], required: true }, // Present / Absent / Leave
  },
  { _id: false }
);

const attendanceDaySchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    records: { type: [recordSchema], default: [] },
  },
  { timestamps: true }
);

// One register per class per day — re-saving a day updates it, never duplicates it.
attendanceDaySchema.index({ classId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceDay', attendanceDaySchema);
