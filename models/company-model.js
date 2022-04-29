const mongoose = require('mongoose');

const { Schema } = mongoose;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,

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

  },
  phone: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  type: {
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
    },
  },

  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Company', companySchema);
