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
    status: {
        type: String,
        required: true,
        default: 'PENDING' 
    },
    offer: [{
        type: Schema.Types.ObjectId,
        ref: "Offer",
    }],
    // PENDING
    // ACTIVE
    // LOST
    // DONE
    
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