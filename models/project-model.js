const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const projectSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    projectType: [{
        type: String,
        required: true,
    }],
    projectImages: [{
        type: String,
        required: true,
    }],
    deadline: {
        type: String,
        required: true,
    },
    address: {
        address: {
            type: String,
            required: true,
        },
        zip: {
            type: String,
            required: true,
        },
    },
    location: {
        type: {
            type: String,
            required: true
        },
        coordinates: {
            type: String,
            required: true
        },
    },
    outreaches: [{
        outreachId: {
            type: Schema.Types.ObjectId,
            ref: "Outreaches",
        },
        companyName: {
            type: String,
        },
        companyLogo: {
            type: String,
        },
        verkerName: {
            type: String,
        },
        verkerProfileImage: {
            type: String,
        },
        initialMessage: {
            type: String,
        },


    }]


}, {
    timestamps: true
});




module.exports = mongoose.model('Projects', projectSchema);