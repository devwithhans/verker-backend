const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const outreachSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Projects",
        required: true,
    },
    initialMessage: {
        type: String,
        required: true,
    },
    company: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: "Companies",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        logo: {
            type: String,
            required: true,
        },
        established: {
            type: Number,
            required: true,
        },
        verkerSince: {
            type: Date,
            required: true,
        },
    },
    totalMessages: {
        type: Number,
        required: true
    },
    members: [{
        userId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        role: {type: String, required: true},
        firstName: {
            type: String,
            required: true
        },
        profileImage: {
            type: String,
            required: true
        },
        totalUnread: {type: Number, required: true}
    }]





}, {
    timestamps: true
});




module.exports = mongoose.model('Outreach', outreachSchema);