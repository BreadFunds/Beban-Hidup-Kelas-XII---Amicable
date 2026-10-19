import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import cron from 'node-cron';
import Assignment from './models/Assignment.js'; // Make sure this path points to your model

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Run every hour: '0 * * * *'
cron.schedule('* * * * *', async () => {
  console.log('Checking for upcoming assignment deadlines...');

  try {
    const now = new Date();
    const in24HoursStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000); 
    const in24HoursEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    // Query MongoDB for assignments due in the 24-hour window
    // Query MongoDB for assignments due in the 24-hour window
    const assignments = await Assignment.find({
      dueDate: { $gte: in24HoursStart, $lte: in24HoursEnd },
      $or: [
        { reminded: false },
        { reminded: { $exists: false } }
      ]
    });

    for (const assignment of assignments) {
      const message = `⚠️ **Reminder:** Your assignment *"${assignment.title}"* is due in 24 hours!`;
      
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      });

      // Mark as reminded so it doesn't spam the chat every hour
      assignment.reminded = true;
      await assignment.save();
      
      console.log(`Reminder sent for: ${assignment.title}`);
    }
  } catch (error) {
    console.error('Failed to send Telegram reminder:', error.response?.data || error.message);
  }
});
