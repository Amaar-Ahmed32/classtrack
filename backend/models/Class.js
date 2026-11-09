// Class — e.g. "Grade 8", section "A". Owned by one teacher (MVP scope:
// each teacher manages their own classes; no shared-school model yet).
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Grade 8"
    section: { type: String, trim: true, default: '' }, // e.g. "A"
    academicYear: { type: String, trim: true, default: '' }, // e.g. "2026-27"
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
