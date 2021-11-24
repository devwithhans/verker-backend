const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const verkerSchema = new Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    phone: {
        type: String,
    },
    profileImage: {
        type: String,
    },
    deviceToken: {
        type: String,

    },
    address: {
        address: {
            type: String
        },
        zip: {
            type: String
        }
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
    },

}, {
    timestamps: true
});



module.exports = mongoose.model('Verker', verkerSchema);