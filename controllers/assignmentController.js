import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Material from '../models/Material.js'; // 1. ADDED MISSING IMPORT

// GET /admin — Render Admin Console
export const getAdminPage = async (req, res) => {
  try {
    // 1. Fetch assignments & users
    const assignments = await Assignment.find({ isArchived: { $ne: true } }).lean();
    const archivedAssignments = await Assignment.find({ isArchived: true }).lean();
    const userCount = await User.countDocuments({ role: 'student' });

    // 2. Fetch class materials
    const materials = await Material.find().sort({ createdAt: -1 }).lean();

    // 3. Format dates & attach input properties
    const formattedAssignments = assignments.map(a => {
      const due = new Date(a.dueDate);
      return {
        ...a,
        rawDueDate: due.toISOString().slice(0, 16),
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

    // Safe user lookup (fallback between req.user and req.session.user)
    const currentUser = req.user || (req.session && req.session.user);

    // 4. Pass materials array to view
    res.render('admin', {
      user: currentUser,
      isAdmin: true,
      assignments: formattedAssignments,
      archivedAssignments: formattedArchived,
      materials: materials || [],
      userCount,
      error: req.query.error || null,
      phone_number: "6285117706008",
      message: "Hello, I'd like to ask something."
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
      return res.redirect('/admin?error=All fields are required');
    }

    const currentUser = req.user || (req.session && req.session.user);

    // Explicitly parse the input as GMT+7 (Asia/Jakarta)
    // Converts "2026-08-14T19:00" -> "2026-08-14T19:00:00+07:00"
    const parsedDueDate = new Date(`${dueDate}:00+07:00`);

    const newAssignment = new Assignment({
      title,
      subject,
      description,
      dueDate: parsedDueDate,
      createdBy: currentUser ? currentUser._id : null
    });

    await newAssignment.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.redirect('/admin?error=Failed to create assignment');
  }
};

// POST /assignments/delete/:id — Delete Assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);

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
    const currentUser = req.user || (req.session && req.session.user);

    if (!currentUser) {
      return res.redirect('/login');
    }

    const userId = currentUser._id;
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

      // --- FIX 1: Format UI text string specifically for GMT+7 (Asia/Jakarta) ---
      const formattedDueDate = dueDate.toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta', // Forces GMT+7
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Set to true if you prefer 12-hour AM/PM format
      });

      // --- FIX 2: Offset date by +7 hours so ISO string matches GMT+7 for datetime-local inputs ---
      let rawDueDate = '';
      if (item.dueDate) {
        const gmt7OffsetMs = 7 * 60 * 60 * 1000;
        const gmt7Date = new Date(dueDate.getTime() + gmt7OffsetMs);
        rawDueDate = gmt7Date.toISOString().slice(0, 16); // Outputs "YYYY-MM-DDTHH:mm"
      }

      const formattedItem = {
        ...item,
        isCompleted,
        isPastDue,
        isDueSoon,
        formattedDueDate,
        rawDueDate
      };

      if (isPastDue) {
        archivedList.push(formattedItem);
      } else {
        activeList.push(formattedItem);
      }
    });

    res.render('dashboard', {
      user: currentUser,
      isAdmin: currentUser.role === 'admin',
      assignments: activeList,
      archivedAssignments: archivedList,
      error: req.flash ? req.flash('error') : null,
      phone_number: "6285117706008",
      message: "Hello, I'd like to ask something."
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
    const currentUser = req.user || (req.session && req.session.user);
    if (!currentUser) return res.redirect('/login');

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.redirect('/dashboard');

    const index = assignment.completedBy.indexOf(currentUser._id);
    if (index === -1) {
      assignment.completedBy.push(currentUser._id);
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