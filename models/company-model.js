const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const companySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    cvr: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    employees: {
        type: Number,
        required: true,
    },
    established: {
        type: Number,
        required: true,
    },
    totalProjects: {
        type: Number,
        default: 0,
    },
    owner: {
        ownerId: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String,
            required: true,
        },
    },
    employeeInvite: [{
        type: String,
    }],
    employeeProfiles: [{
        firstName: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String,
            required: true,
        },
    }],
    avrageRating: {
        totalRatings: {
            type: Number,
            default: 0,
        },
        avrageMedian: {
            type: Number,
            default: 0,
        },
        communication: {
            type: Number,
            default: 0,
        },
        pricePrecision: {
            type: Number,
            default: 0,
        },
        deadline: {
            type: Number,
            default: 0,
        },
        quality: {
            type: Number,
            default: 0,
        },
    },
    last10Ratings: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        firstName: {
            type: String,
            required: true 
        },
        textReview: {
            type: String,
            required: true 
        },
        communication: {
            type: Number,
            default: 0,
        },
        pricePrecision: {
            type: Number,
            default: 0,
        },
        deadline: {
            type: Number,
            default: 0,
        },
        quality: {
            type: Number,
            default: 0,
        },
    }],
    cases: [{
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: [{
            type: String,
            required: true,
        }],
    }],
    certificates: [{
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
    }],
    address: {
        address: {
            type: String,
            required: true
        },
        zip: {
            type: String,
            required: true
        }
    },
    outreaches: [{
        type: Schema.Types.ObjectId,
        ref: 'Outreach',
        required: true,

    }]

}, {
    timestamps: true
});



module.exports = mongoose.model('Company', companySchema);