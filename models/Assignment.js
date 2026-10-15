import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an assignment title'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Please specify the subject/lesson'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide assignment details'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Please set a due date'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Array of student user IDs who have checked off this assignment
  completedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Added the reminded field here so new assignments track notifications automatically:
  reminded: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;