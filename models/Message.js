import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', messageSchema);
export default Message;