const mongoose = require('mongoose');

const { Schema } = mongoose;

const projectSchema = new Schema({
  consumerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'OPEN',
  },
  description: {
    type: String,
    required: true,
  },
  projectType: {
    type: String,
    required: true,
  },
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
      value: 'Point',
    },
    coordinates: {
      type: Array,
      required: true,
    },
  },
  outreaches: [{
    type: Schema.Types.ObjectId,
    ref: 'Outreaches',
  },
  ],
}, {
  timestamps: true,
});

projectSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Projects', projectSchema);
