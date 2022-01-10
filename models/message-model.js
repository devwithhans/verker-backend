const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const messageSchema = new Schema({
    outreachId: {
        type: Schema.Types.ObjectId,
        ref: "Projects",
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        required: true,
    },

}, {
    timestamps: true
});




module.exports = mongoose.model('Message', messageSchema);