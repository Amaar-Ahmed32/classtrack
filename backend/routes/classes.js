// Class routes — every query is scoped to req.user.id, so a teacher can only
// ever see or touch their own classes. Ownership check helper keeps this DRY.
const express = require('express');
const Class = require('../models/Class');
const Student = require('../models/Student');
const AttendanceDay = require('../models/AttendanceDay');
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

router.get('/', async (req, res, next) => {
  try {
    const classes = await Class.find({ teacher: req.user.id }).sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, section, academicYear } = req.body;
    if (!name) {
      const err = new Error('Class name is required');
      err.status = 400;
      throw err;
    }
    const cls = await Class.create({ name, section, academicYear, teacher: req.user.id });
    res.status(201).json(cls);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const cls = await ownedClass(req.params.id, req.user.id);
    const { name, section, academicYear } = req.body;
    if (name !== undefined) cls.name = name;
    if (section !== undefined) cls.section = section;
    if (academicYear !== undefined) cls.academicYear = academicYear;
    await cls.save();
    res.json(cls);
  } catch (err) {
    next(err);
  }
});

// Deletes the class AND its students, attendance days and grades.
// (Cascading delete is deliberate: orphaned registers would corrupt reports.)
router.delete('/:id', async (req, res, next) => {
  try {
    const cls = await ownedClass(req.params.id, req.user.id);
    await Promise.all([
      Student.deleteMany({ classId: cls._id }),
      AttendanceDay.deleteMany({ classId: cls._id }),
      Grade.deleteMany({ classId: cls._id }),
      cls.deleteOne(),
    ]);
    res.json({ message: 'Class and its data deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
