/* eslint no-underscore-dangle: ["error", { "allow": ["_id", "_doc"] }] */
require('dotenv').config();
const { StreamChat } = require('stream-chat');
const bcrypt = require('bcryptjs');

// server_client = stream_chat.StreamChat(api_key="STREAM_KEY", api_secret="STREAM_SECRET")
const apiKey = 'cm6ynpu8m6f9';
const apiSecret = 'twqjvajkmwvdd24epsd9f2z2zgtwb7zhc2mg7cxa9ab4kkn72tpeun3bewvzj42h';
const serverClient = StreamChat.getInstance(apiKey, apiSecret);
const UserModel = require('../../../models/user-model');
const ProjectModel = require('../../../models/project-model');
const OutreachModel = require('../../../models/outreach-model');
const CompanyModel = require('../../../models/company-model');
const { errorName } = require('../../constants');

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
  async createCompany({
    companyInput,
  }, req) {
    console.log('createCompany');

    if (!req.isUser) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }
    const newCompany = new CompanyModel({
      owner: req.userId,
      name: companyInput.name,
      type: companyInput.type,
      description: companyInput.description,
      cvr: companyInput.cvr,
      email: companyInput.email,
      phone: companyInput.phone,
      employees: companyInput.employees,
      logo: companyInput.logo,
      established: companyInput.established,
      address: companyInput.address,
    });

    const result = await newCompany.save();

    if (!result) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }
    await UserModel.findByIdAndUpdate(req.userId, { companyId: result._id.toString() });

    return {
      ...result._doc,
      id: result._id.toString(),
    };
  },
  async createOutreach({
    outreachInput,
  }, req) {
    if (!req.isVerker) {
      const error = new Error('NOT_VERKER');
      throw error;
    }

    const project = await ProjectModel.findById(outreachInput.projectId).populate('consumerId');

    const user = await UserModel.findById(req.userId).populate('companyId');

    // for (var i in user.companyId.outreaches) {
    //     if (user.companyId.outreaches[i].projectId.toString() == project._id.toString()) {
    //         const error = new Error('ALREADT_OUTREACHED')
    //         throw error;
    //     }
    // }

    // if (user.companyId.roles.get(req.userId) !== 'Owner') {
    //   const error = new Error('NEED_OWNER_ACCOUNT');
    //   throw error;
    // }

    const newOutreach = OutreachModel({
      projectId: outreachInput.projectId,
      projectTitle: project.title,
      companyId: user.companyId._id,
      verkerId: req.userId,
      consumerId: project.consumerId,
      company: {
        name: user.companyId.name,
        logo: user.companyId.logo,
        established: user.companyId.established,
        verkerSince: user.companyId.createdAt,
      },
    });

    const savedOutreach = await newOutreach.save();

    if (!savedOutreach) {
      const error = new Error('UNABLE_TO_SAVE_OUTREACH');
      throw error;
    }

    const pushOutreachesToProject = {
      $push: {
        outreaches: savedOutreach._id,
      },
    };

    const pushOutreachesToCompany = {
      $push: {
        outreaches: {
          outreachId: savedOutreach._id,
          projectId: project._id,
        },
      },
    };

    await project.updateOne(pushOutreachesToProject);

    await CompanyModel.findOneAndUpdate({
      _id: user.companyId._id,
    }, pushOutreachesToCompany);

    console.log(savedOutreach._id);

    const channel = await serverClient.channel('messaging', savedOutreach._id.toString(), {
      image: user.profileImage,
      members: [project.consumerId._id.toString(), req.userId],
      created_by_id: req.userId,
      companyName: user.companyId.name,
      verkerName: user.firstName,
      projectTitle: project.title,
      projectId: project._id,
      outreachId: savedOutreach._id,
      companyId: user.companyId._id,
      consumerId: project.consumerId._id.toString(),
    });
    await channel.create();

    await channel.sendMessage({
      user: {
        id: req.userId,
      },
      text: outreachInput.initialMessage,
    });

    return savedOutreach;
  },

};
