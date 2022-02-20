const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const outreachSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Projects",
        required: true,
    },
    projectTitle: {
        type: String,
        required: true,
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: "Companies",
        required: true,
    },
    verkerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    consumerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    company: {
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





}, {
    timestamps: true
});




module.exports = mongoose.model('Outreach', outreachSchema);