import mongoose from 'mongoose';

const WordListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  language: { type: String, default: 'en' },
  words: [{ type: String, lowercase: true, trim: true }],
  createdByRoomCode: { type: String, default: null }
});

export const WordListModel = mongoose.model('WordList', WordListSchema);
