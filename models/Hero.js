const {model, Schema} = require('mongoose');

const heroSchema = new Schema({
    name: String,
    color: String,
    updatedAt: Number,
    deleted: Boolean,
},
{ timestamps: true }
);

module.exports = model('Hero', heroSchema);