import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
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
    material: {
        type: String,
        required: [true, 'Please provide assignment details'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const createMaterial = async (req, res) => {
    try {
        const {
            title,
            subject,
            material,
        } = req.body;

        // Basic validation
        if (!title || !subject || !material) {
            return res.status(400).redirect('/admin?error=All fields are required');
        }

        // Create and save new material record
        const newMaterial = new Material({
            title,
            subject,
            material,
            createdBy: req.session.user._id
        });

        await newMaterial.save();

        // Redirect back to admin console on success
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).redirect('/admin?error=Failed to create assignment');
    }
};

const Material = mongoose.model('Assignment', materialSchema);
export default Material;