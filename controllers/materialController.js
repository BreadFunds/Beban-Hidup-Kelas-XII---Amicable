import Material from '../models/Material.js';
import User from '../models/User.js';

export const getMaterialPage = async (req, res) => {
  try {
    // Fetch active assignments (including docs where isArchived is undefined)
    const material = await Assignment.find({ isArchived: { $ne: true } }).lean();
    const archivedAssignments = await Assignment.find({ isArchived: true }).lean();
    const userCount = await User.countDocuments({ role: 'student' });

    // Format dates & attach input properties
    const formattedAssignments = assignments.map(a => {
      const due = new Date(a.dueDate);
      return {
        ...a,
        rawDueDate: due.toISOString().slice(0, 16), // Pre-fills <input type="datetime-local">
        formattedDueDate: due.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      };
    });

    const formattedArchived = archivedAssignments.map(a => ({
      ...a,
      formattedDueDate: new Date(a.dueDate).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    }));

    res.render('admin', {
      user: req.session.user,
      isAdmin: true,
      assignments: formattedAssignments,
      archivedAssignments: formattedArchived,
      userCount,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error rendering admin page:', err);
    res.status(500).redirect('/dashboard');
  }
};
