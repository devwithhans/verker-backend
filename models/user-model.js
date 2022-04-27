const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userSchema = new Schema({
    firstName:  { 
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String,
        // required: true,
    },
    deviceToken: {
        type: String,
    },
    platform: {
        type: String,
        required: true,
    },
    address: {
        address: {type: String, required: false},
        zip: {type: String, required: false}
    },
     companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
    },
    projects: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Projects'
        }
      ]
    
  }, {timestamps: true});



module.exports = mongoose.model('User', userSchema);