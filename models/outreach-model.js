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
    images: {
        type: Array,
        required: true,
    },
    company: {
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "Companies",
            required: true,
        },
        companyName: {
            type: String,
            required: true,
        },
        companyLogo: {
            type: String,
            required: true,
        },
        established: {
            type: Date,
            required: true,
        },
        verkerSince: {
            type: Date,
            required: true,
        },
        reviews: {
            totalReviews: {
                type: Number,
                required: true,
            },
            avrage: {
                type: Number,
                required: true
            },
        }
    },
    offers: [{
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        projectStart: {
            type: Date,
        },
        projectEnd: {
            type: Date,
        },
        materialPrice: {
            type: Number,
        },
        salery: {
            type: Number,
        },
        status: {
            type: String,
        },
    }],
    leadVerker: {
        verkerId: {
            type: Schema.Types.ObjectId,
            ref: "Verker",
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String,
            required: true,
        },
    },
    consumer: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        profileImage: {
            type: String,
            required: true
        }
    },
    totalMessage: {
        type: Number,
        required: true
    },
    members: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        totalUnread: {type: Number, required: true}
    }]





}, {
    timestamps: true
});




module.exports = mongoose.model('Projects', projectSchema);