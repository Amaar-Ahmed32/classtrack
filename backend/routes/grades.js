// Grade routes — simple gradebook. Totals/percentages are computed on read
// so they can never go stale when a mark is edited.
const express = require('express');
const Class = require('../models/Class');
const Grade = require('../models/Grade');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(protect, requireRole('teacher'));

async function ownedClass(classId, teacherId) {
  const cls = await Class.findOne({ _id: classId, teacher: teacherId });
  if (!cls) {
    const err = new Error('Class not found');
    err.status = 404;
    throw err;
  }
  return cls;
}

// GET /api/grades?classId=...&term=... — grades plus per-student totals.
router.get('/', async (req, res, next) => {
  try {
    const { classId, term } = req.query;
    if (!classId) {
      const err = new Error('classId query parameter is required');
      err.status = 400;
      throw err;
    }
    await ownedClass(classId, req.user.id);
    const filter = { classId, teacher: req.user.id };
    if (term) filter.term = term;
    const grades = await Grade.find(filter).populate('student', 'name rollNo').sort({ 'student.name': 1 });
    const totals = {};
    grades.forEach((g) => {
      const key = g.student._id.toString();
      totals[key] = totals[key] || { student: g.student, obtained: 0, total: 0 };
      totals[key].obtained += g.marks;
      totals[key].total += g.totalMarks;
    });
    const summary = Object.values(totals).map((t) => ({
      ...t,
      percentage: t.total === 0 ? null : Math.round((t.obtained / t.total) * 100),
    }));
    res.json({ grades, summary });
  } catch (err) {
    next(err);
  }
});

// POST /api/grades — upsert one student/subject/term grade.
router.post('/', async (req, res, next) => {
  try {
    const { classId, student, subject, term, marks, totalMarks } = req.body;
    if (!classId || !student || !subject || marks === undefined || !totalMarks) {
      const err = new Error('classId, student, subject, marks and totalMarks are required');
      err.status = 400;
      throw err;
    }
    await ownedClass(classId, req.user.id);
    const grade = await Grade.findOneAndUpdate(
      { student, subject, term: term || 'Term 1' },
      { classId, teacher: req.user.id, student, subject, term: term || 'Term 1', marks, totalMarks },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(grade);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const grade = await Grade.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    if (!grade) {
      const err = new Error('Grade not found');
      err.status = 404;
      throw err;
    }
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
