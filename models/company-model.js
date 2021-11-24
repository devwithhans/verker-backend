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
    logo: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    roles: {
        type: Map,
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
    location: {
        type: {
            type: String,
            required: true
        },
        coordinates: {
            type: Array,
            required: true
        },
    },
    outreaches: [{
            outreachId: {
                type: Schema.Types.ObjectId,
                ref: 'Outreach',
                required: true,
            },
            projectId: {
                type: Schema.Types.ObjectId,
                ref: 'Project',
                required: true,
            }
        },

    ]
}, {
    timestamps: true
});



module.exports = mongoose.model('Company', companySchema);