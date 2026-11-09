// Student — belongs to one class. parentPhone is the WhatsApp target for
// absence alerts; store it in international format when possible (e.g. 923001234567).
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, trim: true },
    parentName: { type: String, trim: true, default: '' },
    parentPhone: { type: String, trim: true, default: '' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    active: { type: Boolean, default: true }, // soft-delete: leaving students stay in old registers
  },
  { timestamps: true }
);

// Roll numbers are unique per class (a teacher may reuse "1" in another class).
studentSchema.index({ classId: 1, rollNo: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
