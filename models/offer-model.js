const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const offerSchema = new Schema({
    status: {
        type: String,            
        required: true,
    },  

    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Projects",
        required: true,
    },

    outreachId: {
        type: Schema.Types.ObjectId,
        ref: "Outreach",
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
    consumerName: {
        type: String,            
        required: true,
    }, 
    consumerAddress: {
        address: {type: String, required: true},
        zip: {type: String, required: true}
    },


    companyId: {
        type: Schema.Types.ObjectId,
        ref: "Companies",
        required: true,
    },
    companyName: {
        type: String,            
        required: true,
    }, 
    cvr: {
        type: String,           
        required: true,
    },
    companyAddress: {
        address: {type: String, required: true},
        zip: {type: String, required: true}
    },
    companyEmail: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    materials: [{
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        }
    }],
    hours: {
        type: Number,
    },
    hourlyRate: {
        type: Number,
    },
    hoursTotal: {
        type: Number,
    },
    materialsTotal: {
        type: Number,
    },    
    startDate: {
        type: Date,
    },
    offerExpires: {
        type: Date,
    }



}, {
    timestamps: true
});




module.exports = mongoose.model('Offer', offerSchema);