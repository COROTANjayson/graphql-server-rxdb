const {model, Schema} = require('mongoose');

const checkpointSchema = new Schema({
    id: String,
    updatedAt: Number,
});

module.exports = model('Checkpoint', checkpointSchema);