// Student routes — CRUD per class plus CSV roster import.
// Import accepts JSON { classId, csv } where `csv` is the raw pasted text.
// (Paste-in beats file upload for an MVP: no multer, no disk handling, and it
// works identically on mobile browsers teachers actually use.)
const express = require('express');
const Class = require('../models/Class');
const Student = require('../models/Student');
const { protect, requireRole } = require('../middleware/auth');
const { parseRosterCSV } = require('../utils/csv');

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

router.get('/', async (req, res, next) => {
  try {
    const { classId } = req.query;
    if (!classId) {
      const err = new Error('classId query parameter is required');
      err.status = 400;
      throw err;
    }
    await ownedClass(classId, req.user.id);
    const students = await Student.find({ classId, active: true }).sort({ rollNo: 1, name: 1 });
    res.json(students);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { classId, name, rollNo, parentName, parentPhone } = req.body;
    if (!classId || !name || !rollNo) {
      const err = new Error('classId, name and rollNo are required');
      err.status = 400;
      throw err;
    }
    await ownedClass(classId, req.user.id);
    const student = await Student.create({
      classId, name, rollNo, parentName, parentPhone, teacher: req.user.id,
    });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      err.message = 'A student with this roll number already exists in this class';
      err.status = 409;
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    const { name, rollNo, parentName, parentPhone, active } = req.body;
    if (name !== undefined) student.name = name;
    if (rollNo !== undefined) student.rollNo = rollNo;
    if (parentName !== undefined) student.parentName = parentName;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (active !== undefined) student.active = active;
    await student.save();
    res.json(student);
  } catch (err) {
    if (err.code === 11000) {
      err.message = 'A student with this roll number already exists in this class';
      err.status = 409;
    }
    next(err);
  }
});

// Soft-delete: keeps historical registers intact.
router.delete('/:id', async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    student.active = false;
    await student.save();
    res.json({ message: 'Student deactivated' });
  } catch (err) {
    next(err);
  }
});

// POST /api/students/import  { classId, csv }
// Upserts by rollNo within the class: existing roll numbers are updated
// (name/phone corrections), new ones are inserted. Never duplicates.
router.post('/import', async (req, res, next) => {
  try {
    const { classId, csv } = req.body;
    if (!classId || !csv) {
      const err = new Error('classId and csv text are required');
      err.status = 400;
      throw err;
    }
    await ownedClass(classId, req.user.id);
    const { students, errors } = parseRosterCSV(csv);
    let inserted = 0;
    let updated = 0;
    for (const row of students) {
      const result = await Student.findOneAndUpdate(
        { classId, rollNo: row.rollNo },
        { ...row, teacher: req.user.id, active: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // findOneAndUpdate with upsert doesn't tell us insert-vs-update directly;
      // createdAt == updatedAt is a reliable-enough signal for an import summary.
      if (result.createdAt.getTime() === result.updatedAt.getTime()) inserted += 1;
      else updated += 1;
    }
    res.json({ inserted, updated, skipped: errors.length, errors });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
