/* eslint no-underscore-dangle: ["error", { "allow": ["_id", "_doc"] }] */
require('dotenv').config();

const bcrypt = require('bcryptjs');

const UserModel = require('../../../models/user-model');
const ProjectModel = require('../../../models/project-model');
// const MessageModel = require('../../../models/message-model');

const {
  errorName,
} = require('../../constants');

module.exports = {
  async createUser({
    userInput,
  }) {
    console.log('createUser');
    const existingUser = await UserModel.findOne({
      email: userInput.email.toLowerCase(),
    });
    if (existingUser) {
      const error = new Error(errorName.USER_ALREADY_EXISTS);
      throw error;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);

    const newUser = new UserModel({
      ...userInput,
      profileImage: userInput.profileImage || 'https://s.starladder.com/uploads/team_logo/d/4/d/3/ce3c2349c7e3a70dac35cf4a28c400b9.png',
      email: userInput.email.toLowerCase(),
      password: hashedPw,
    });

    const result = await newUser.save();

    if (!result) {
      throw new Error(errorName.USER_ALREADY_EXISTS);
    }

    return {
      ...result._doc,
      id: result._id.toString(),
    };
  },
  async createProject({
    projectInput,
  }, req) {
    console.log('createProject');

    if (!req.isUser) {
      const error = new Error('Not authorized');
      error.statusCode = 404;
      throw error;
    }

    const newProject = new ProjectModel({
      consumerId: req.userId,
      title: projectInput.title,
      description: projectInput.description,
      projectType: projectInput.projectType,
      projectImages: projectInput.projectImages,
      deadline: new Date(projectInput.deadline),
      address: projectInput.address,
      location: projectInput.location,
    });

    const result = await newProject.save();

    const user = await UserModel.findById(req.userId);
    user.projects.push(result._id);
    await user.save();

    return {
      ...result._doc,

      id: result._id.toString(),
    };
  },
};
