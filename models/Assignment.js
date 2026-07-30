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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const createAssignment = async (req, res) => {
  try {
    const { title, subject, description, dueDate } = req.body;

    // Basic validation
    if (!title || !subject || !description || !dueDate) {
      return res.status(400).redirect('/admin?error=All fields are required');
    }

    // Create and save new assignment record
    const newAssignment = new Assignment({
      title,
      subject,
      description,
      dueDate: new Date(dueDate),
      createdBy: req.session.user._id
    });

    await newAssignment.save();

    // Redirect back to admin console on success
    res.redirect('/admin');
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).redirect('/admin?error=Failed to create assignment');
  }
};

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;