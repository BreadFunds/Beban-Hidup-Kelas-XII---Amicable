import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

// GET /admin — Render Admin Console
export const getAdminPage = async (req, res) => {
  try {
    // Fetch active assignments (including docs where isArchived is undefined)
    const assignments = await Assignment.find({ isArchived: { $ne: true } }).lean();
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

// POST /assignments — Create New Assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, subject, description, dueDate } = req.body;

    if (!title || !subject || !description || !dueDate) {
      return res.status(400).redirect('/admin?error=All fields are required');
    }

    const newAssignment = new Assignment({
      title,
      subject,
      description,
      dueDate: new Date(dueDate),
      createdBy: req.session.user._id
    });

    await newAssignment.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).redirect('/admin?error=Failed to create assignment');
  }
};

// POST /assignments/delete/:id — Delete Assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);

    // Redirect back to whichever page sent the delete request
    const redirectUrl = req.headers.referer || '/admin';
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).redirect('/admin?error=Failed to delete assignment');
  }
};

// GET /dashboard — Student & Admin Dashboard
export const getDashboard = async (req, res) => {
  try {
    // 1. Guard check: If no user is logged in, redirect to login page
    if (!req.user) {
      return res.redirect('/login');
    }

    const userId = req.user._id;
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

    const allAssignments = await Assignment.find().lean();

    const activeList = [];
    const archivedList = [];

    allAssignments.forEach(item => {
      const dueDate = new Date(item.dueDate);
      
      const isPastDue = dueDate < now;
      
      const isCompleted = Array.isArray(item.completedBy) 
        ? item.completedBy.some(id => id.toString() === userId.toString())
        : Boolean(item.isCompleted);

      const isDueSoon = !isCompleted && !isPastDue && (dueDate <= twentyFourHoursFromNow);

      const formattedItem = {
        ...item,
        isCompleted,
        isPastDue,
        isDueSoon,
        formattedDueDate: dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        rawDueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 16) : ''
      };

      if (isPastDue) {
        archivedList.push(formattedItem);
      } else {
        activeList.push(formattedItem);
      }
    });

    res.render('dashboard', {
      user: req.user,
      isAdmin: req.user.role === 'admin',
      assignments: activeList,
      archivedAssignments: archivedList,
      error: req.flash ? req.flash('error') : null
    });
  } catch (err) {
    console.error('Error rendering dashboard:', err);
    res.status(500).render('dashboard', { error: 'Failed to load assignments.' });
  }
};

// POST /assignments/toggle/:id — Toggle completion checkmark
export const toggleAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.redirect('/dashboard');

    const index = assignment.completedBy.indexOf(userId);
    if (index === -1) {
      assignment.completedBy.push(userId);
    } else {
      assignment.completedBy.splice(index, 1);
    }

    await assignment.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error toggling assignment:', err);
    res.redirect('/dashboard');
  }
};

// POST /assignments/update/:id — Admin Edit Assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, description, dueDate } = req.body;

    await Assignment.findByIdAndUpdate(id, {
      title,
      subject,
      description,
      dueDate: new Date(dueDate)
    });

    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.redirect('/admin?error=Failed to update assignment');
  }
};