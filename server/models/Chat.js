import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  parts: [
    {
      text: {
        type: String,
        required: true
      }
    }
  ],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  persona: {
    type: String,
    enum: ['hitesh', 'piyush'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  messages: [MessageSchema]
});

export const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
