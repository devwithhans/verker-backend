require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { StreamChat } = require('stream-chat');

const apiKey = 'cm6ynpu8m6f9';
const apiSecret = 'twqjvajkmwvdd24epsd9f2z2zgtwb7zhc2mg7cxa9ab4kkn72tpeun3bewvzj42h';

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

const UserModel = require('../../models/user-model');
const ProjectModel = require('../../models/project-model');
const OutreachModel = require('../../models/outreach-model');
const CompanyModel = require('../../models/company-model');
const OfferModel = require('../../models/offer-model');

const {
  errorName,
  errorType,
} = require('../constants');

const jwtHt = process.env.JWT_TOKEN;

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function getDistanceFromLatLonInKm(lon1, lat1, lon2, lat2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
          * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/* eslint no-underscore-dangle: ["error", { "allow": ["_id", "_doc"] }] */

module.exports = {
  async createUser({
    userInput,
  }) {
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

  async getUser(res, req) {
    if (!req.isUser && !req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const user = await UserModel.findById(req.userId);

    if (!user) {
      const error = new Error(errorName.USER_DOES_NOT_EXIST);
      throw error;
    }

    const userToken = serverClient.createToken(user._id.toString());

    return {
      ...user._doc,
      streamToken: userToken,
    };
  },
  async refreshJWT(req) {
    if (!req.userId) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const user = await UserModel.findById(req.userId);
    let company = await CompanyModel.findById(user.companyId);

    if (user.companyId) {
      if (user.companyId.toString().length === 24) {
        company = await CompanyModel.findById(user.companyId);
      }
    }

    const jsonWebToken = await jwt.sign({
      email: user.email,
      userId: user._id.toString(), // If the user is autorised then we create a Json Web Token
      role: company != null ? 'verker' : 'user',
      companyId: user.companyId ??= '',
      // The following is the secret key, that can unlock the token cryptation
    }, jwtHt, {
      // expiresIn: '1h'
    });
    const userToken = serverClient.createToken(user._id.toString());

    return {
      jwt: jsonWebToken,
      user: {
        ...user._doc,

        streamToken: userToken,
      },
    };
  },

  async signinUser({
    email,
    password,
    verker,
  }) {
    const user = await UserModel.findOne({
      email, // Checking if the email exists in the database
    });

    if (!user) {
      throw new Error(errorName.EMAIL_NOT_FOUND);
    }

    let company;
    if (user.companyId) {
      if (verker && user.companyId.toString().length === 24) {
        company = await CompanyModel.findById(user.companyId);
      }
    }

    const pwMatch = await bcrypt.compare(password, user.password);
    // If the email exists then we check if the password entered match

    if (!pwMatch) {
      const error = new Error('PASSWORD_IS_INCORRECT'); // We throw a error if the password does not match
      error.statusCode = 404;
      throw error;
    }

    const jsonWebToken = await jwt.sign({
      email: user.email,
      userId: user._id.toString(), // If the user is autorised then we create a Json Web Token
      role: company != null ? 'verker' : 'user',
      companyId: user.companyId ??= '',
      // The following is the secret key, that can unlock the token cryptation
    }, jwtHt, {
      // expiresIn: '1h'
    });

    const userToken = serverClient.createToken(user._id.toString());

    // const response = await serverClient.upsertUsers([{
    //   id: user._id.toString(),
    //   role: 'user',
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   image: user.profileImage,

    // }]);

    return {
      jwt: jsonWebToken,
      verker: company != null,
      user: {
        ...user._doc,
        verker: company != null,
        streamToken: userToken,
      },
    };
  },

  async createProject({
    projectInput,
  }, req) {
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
  async getProjects(req) {
    if (!req.isUser && !req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const project = await ProjectModel.find({
      consumerId: req.userId,
    });

    if (!project) {
      throw new Error(errorType.NO_PROJECTS);
    }

    return project;
  },
  async getOutreaches(req) {
    if (!req.isUser) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const outreaches = await OutreachModel.find({
      consumerId: req.userId,
    });

    return outreaches;
    // return outreaches
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

    user.companyId.outreaches.forEach((e) => {
      if (e.projectId.toString() === project._id.toString()) {
        const error = new Error(errorName.ALREADT_OUTREACHED);
        throw error;
      }
    });

    if (user.companyId.owner !== user._id.toString()) {
      const error = new Error('NEED_OWNER_ACCOUNT');
      throw error;
    }

    const newOutreach = OutreachModel({
      projectId: outreachInput.projectId,
      projectTitle: project.title,
      companyId: user.companyId._id,
      verkerId: req.userId,
      consumerId: project.consumerId,
      company: {
        name: user.companyId.name,
        logo: user.companyId.logo ?? '',
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
      id: user.companyId._id,
    }, pushOutreachesToCompany);

    const channel = await serverClient.channel('messaging', savedOutreach._id.toString(), {
      image: user.profileImage,
      members: [project.consumerId._id.toString(), req.userId],
      created_byid: req.userId,
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

  async updateOffer({
    offerInput,
  }) {
    // if (!req.isVerker) {
    //     const error = new Error(errorName.NOT_VERKER);
    //     throw error;
    // }
    if (offerInput.offerId) {
      try {
        const oldOffer = await OfferModel.findByIdAndUpdate(offerInput.offerId, { status: 'oldOffer' });
        if (oldOffer) {
          await serverClient.updateMessage({
            id: offerInput.offerId, message: '', offer: oldOffer._id.toString(), userid: offerInput.verkerId,
          });
        }
      } catch (error) {
        throw Error(errorName.NO_SOCKET_FOUND);
      }
    }

    const newOffer = OfferModel(offerInput);
    const savedOffer = await newOffer.save();

    const channel = await serverClient.getChannelById('messaging', offerInput.outreachId);

    await channel.sendMessage({
      id: savedOffer._id.toString(),
      user: {
        id: offerInput.verkerId,
      },
      text: 'Det virker vist',
      offerId: savedOffer._id.toString(),
    });
    return 'fine';
  },

  async getOffer({
    offerId,
  }) {
    const offer = await OfferModel.findById(offerId);
    if (!offer) {
      throw Error(errorName.NO_SOCKET_FOUND);
    }
    return offer;
  },

  async browseProjects({
    limit,
    skip,
    coordinates,
    maxDistance,
    type,
  }, req) {
    if (!req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const company = await CompanyModel.findById(req.companyId);

    if (!company) throw new Error(errorName.NOT_VERKER);

    const outreachIds = company.outreaches.map((item) => item.projectId);

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
      projectType: type,
      id: {
        $nin: outreachIds,
      },

    };

    // We find the projects for the current user
    const projects = await ProjectModel.find(query).limit(limit).skip(skip);

    // if (projects.length === 0) {
    //     const error = new Error('NO_PROJECTS');
    //     throw error;
    // }

    projects.forEach(async (e) => {
      const distance = await getDistanceFromLatLonInKm(
        e.location.coordinates[0],
        e.location.coordinates[1],
        coordinates[0],
        coordinates[1],
      );
      Object.assign(e, {
        distance,
      });
    });

    return projects;
  },
  async verkerGetProjects(req) {
    if (!req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const outreaches = await OutreachModel.find({
      companyId: req.companyId,
    }).populate('projectId').sort([['updatedAt', -1]]);

    const result = [];

    outreaches.forEach((e) => {
      result.push({
        project: e.projectId,
        outreach: e,
      });
    });
    return result;
  },
};
