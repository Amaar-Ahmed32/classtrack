// Grade — one row per student per subject per term. Totals/percentages are
// computed on read (routes/grades.js) rather than stored, so edits can never
// leave a stale total behind.
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    term: { type: String, trim: true, default: 'Term 1' },
    marks: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

// One grade per student/subject/term — re-entering updates instead of duplicating.
gradeSchema.index({ student: 1, subject: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
