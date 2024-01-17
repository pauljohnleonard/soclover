/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');

// Define the Mongoose schema for the Card class
const cardSchema = new mongoose.Schema({
  words: {
    type: [String], // Assuming words is a string, adjust the type accordingly
    required: true,
  },
  slot: {
    type: Number, // Assuming slot is a number, adjust the type accordingly
    required: true,
  },
  heapSlot: {
    type: Number, // Assuming heapSlot is a number, adjust the type accordingly
    required: true,
  },
});

// Create the Mongoose model based on the schema
export const CardModel = mongoose.model('Card', cardSchema);

// Export the model for use in other parts of your application

// Define the Mongoose schema for the Hand class
const handSchema = new mongoose.Schema(
  {
    cards: [cardSchema], // Using the Card schema within the cards array
    playerName: {
      type: String,
      required: true,
      index: true,
    },
    clues: {
      type: [String],
      default: [],
      required: true,
    },
  },
  { timestamps: true }
);

// Create the Mongoose model based on the schema
export const HandModel = mongoose.model('Hand', handSchema);

// Export the model for use in other parts of your application
