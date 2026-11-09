// Attendance routes — save a day's register (upsert) and read the monthly register.
// Saving a day fires absence alerts for newly-absent students through the
// WhatsApp hook (utils/whatsapp.js). Alerts are fire-and-forget: a slow or
// failing alert must never block the teacher saving attendance.
const express = require('express');
const Class = require('../models/Class');
const Student = require('../models/Student');
const AttendanceDay = require('../models/AttendanceDay');
const { protect, requireRole } = require('../middleware/auth');
const { startOfDay, monthRange } = require('../utils/dates');
const { sendAbsenceAlert } = require('../utils/whatsapp');

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

// POST /api/attendance  { classId, date, records: [{ student, status }] }
// Creates or replaces the whole day's register in one upsert.
router.post('/', async (req, res, next) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records)) {
      const err = new Error('classId, date and records array are required');
      err.status = 400;
      throw err;
    }
    const cls = await ownedClass(classId, req.user.id);
    const day = startOfDay(date);

    // Only students of this class may appear in its register.
    const validIds = new Set(
      (await Student.find({ classId, active: true }).select('_id')).map((s) => s._id.toString())
    );
    const clean = records.filter(
      (r) => validIds.has(String(r.student)) && ['P', 'A', 'L'].includes(r.status)
    );

    const saved = await AttendanceDay.findOneAndUpdate(
      { classId, date: day },
      { classId, teacher: req.user.id, date: day, records: clean },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Absence alerts (non-blocking): only for students marked Absent today.
    const dateLabel = day.toISOString().slice(0, 10);
    const absent = await Student.find({
      _id: { $in: clean.filter((r) => r.status === 'A').map((r) => r.student) },
    });
    absent.forEach((student) => {
      sendAbsenceAlert({
        parentPhone: student.parentPhone,
        parentName: student.parentName,
        studentName: student.name,
        className: `${cls.name}${cls.section ? `-${cls.section}` : ''}`,
        dateLabel,
      }).catch((e) => console.error('Absence alert failed:', e.message));
    });

    res.json(saved);
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/:classId/day?date=YYYY-MM-DD — one day's register.
router.get('/:classId/day', async (req, res, next) => {
  try {
    await ownedClass(req.params.classId, req.user.id);
    const day = await AttendanceDay.findOne({
      classId: req.params.classId,
      date: startOfDay(req.query.date),
    });
    res.json(day || { classId: req.params.classId, date: startOfDay(req.query.date), records: [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/:classId/register?month=YYYY-MM
// Returns a register matrix: students, the days that were marked, and per-student
// totals. Attendance % = present days / total marked days for that student.
// (Leave days count as marked days — a documented choice; see NOTES.md.)
router.get('/:classId/register', async (req, res, next) => {
  try {
    await ownedClass(req.params.classId, req.user.id);
    const month = req.query.month;
    if (!/^\d{4}-\d{2}$/.test(month || '')) {
      const err = new Error('month query parameter must be YYYY-MM');
      err.status = 400;
      throw err;
    }
    const [start, end] = monthRange(month);
    const students = await Student.find({ classId: req.params.classId, active: true })
      .sort({ rollNo: 1, name: 1 })
      .lean();
    const days = await AttendanceDay.find({
      classId: req.params.classId,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 }).lean();

    const byStudent = {};
    students.forEach((s) => {
      byStudent[s._id.toString()] = { student: s, marks: {}, present: 0, absent: 0, leave: 0 };
    });
    const dayLabels = [];
    days.forEach((d) => {
      const label = d.date.toISOString().slice(0, 10);
      dayLabels.push(label);
      d.records.forEach((r) => {
        const entry = byStudent[r.student.toString()];
        if (!entry) return; // student deactivated after the day was marked
        entry.marks[label] = r.status;
        if (r.status === 'P') entry.present += 1;
        if (r.status === 'A') entry.absent += 1;
        if (r.status === 'L') entry.leave += 1;
      });
    });
    const rows = Object.values(byStudent).map((e) => {
      const total = e.present + e.absent + e.leave;
      return {
        student: e.student,
        marks: e.marks,
        present: e.present,
        absent: e.absent,
        leave: e.leave,
        percentage: total === 0 ? null : Math.round((e.present / total) * 100),
      };
    });
    res.json({ month, days: dayLabels, rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
