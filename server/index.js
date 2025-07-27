import express from 'express';
import dotenv from 'dotenv';
dotenv.config(); // ✅ Load env vars first

import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import './config/passport.js';

import http from 'http'; // 👈 For socket.io
import { Server } from 'socket.io';
import { initSocket } from './socket.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import selfHelpRoutes from './routes/selfHelpRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tipRoutes from './routes/tips.js';
import reviewRoutes from './routes/reviewRoutes.js';

// Cron job
import cron from 'node-cron';
import { sendUpcomingReminders } from './cron/sendReminders.js';

const app = express();

const server = http.createServer(app);
initSocket(server);

const allowedOrigins = [
  "http://localhost:5173",
  "https://mindmend-1.vercel.app",
];

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(session({
  secret: 'mindmend', resave: false, saveUninitialized: false, cookie: {
    secure: true, // only over HTTPS
    sameSite: 'Lax',
    httpOnly: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/selfhelp', selfHelpRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/reviews', reviewRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Cron
cron.schedule('0 * * * *', () => {
  console.log('⏰ Running reminder job...');
  sendUpcomingReminders();
});

// ==========================
// 👇 Socket.IO for Video Call
// ==========================
// io.on('connection', (socket) => {
//   console.log('✅ New socket connected:', socket.id);

//   socket.on('join-room', (data) => {
//     if (!data || !data.roomId) {
//       console.error("❌ Invalid join-room payload:", data);
//       return;
//     }

//     const { roomId } = data;
//     socket.join(roomId);
//     socket.to(roomId).emit('user-joined', socket.id);
//   });

//   socket.on('call-user', ({ userToCall, signalData, from }) => {
//     io.to(userToCall).emit('incoming-call', { signal: signalData, from });
//   });

//   socket.on('answer-call', ({ to, signal }) => {
//     io.to(to).emit('call-accepted', signal);
//   });

//   socket.on('disconnect', () => {
//     console.log('❌ Socket disconnected:', socket.id);
//   });
// });
