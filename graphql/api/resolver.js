require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const StreamChat = require('stream-chat').StreamChat; 

const api_key = 'cm6ynpu8m6f9' 
const api_secret = 'twqjvajkmwvdd24epsd9f2z2zgtwb7zhc2mg7cxa9ab4kkn72tpeun3bewvzj42h' 

const serverClient = StreamChat.getInstance(api_key,api_secret); 




const UserModel = require('../../models/user-model');
const ProjectModel = require('../../models/project-model');
const OutreachModel = require('../../models/outreach-model')
const MessageModel = require('../../models/message-model');
const CompanyModel = require('../../models/company-model');


const {
    errorName,
    errorType
} = require('../constants')

const jwtHt = process.env.JWT_TOKEN;

module.exports = {
    createUser: async function ({
        userInput
    }, req) {
        const existingUser = await UserModel.findOne({
            email: userInput.email
        });
        if (existingUser) {
            const error = new Error('User already exists');
            throw error;
        }

        const hashedPw = await bcrypt.hash(userInput.password, 12);

        const newUser = new UserModel({
            firstName: userInput.firstName,
            lastName: userInput.lastName,
            profileImage: userInput.profileImage || "https://s.starladder.com/uploads/team_logo/d/4/d/3/ce3c2349c7e3a70dac35cf4a28c400b9.png",
            deviceToken: userInput.deviceToken,
            address: userInput.address,
            email: userInput.email,
            phone: userInput.phone,
            password: hashedPw,
        });

        const result = await newUser.save();

        return {
            ...result._doc,
            _id: result._id.toString()
        }

    },
    getUser: async function ({}, req) {
        if (!req.isUser) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        const user = await UserModel.findById(req.userId);


        if (!user) {
            const error = new Error(errorName.USER_DOES_NOT_EXIST);
            throw error;
        }

        const userToken = serverClient.createToken(user._id.toString());
        
        console.log(userToken);

        return {
            ...user._doc,
            streamToken: userToken
        }

    },
    signinUser: async function ({
        email,
        password,
        verker
    }) {
        const user = await UserModel.findOne({
            email: email // Checking if the email exists in the database
        });

        let company;
        if(company && user.companyId.length == 24){
            company = await CompanyModel.findById(user.companyId);
        }

        if (!user) {
            const error = new Error('No user was found'); // if the user does not exist we throw a error
            error.statusCode = 404;
            throw error;
        }

        const pwMatch = await bcrypt.compare(password, user.password); // If the email exists then we check if the password entered match

        if (!pwMatch) {
            const error = new Error('PASSWORD_IS_INCORRECT'); // We throw a error if the password does not match
            error.statusCode = 404;
            throw error;
        }

        const jsonWebToken = await jwt.sign({
            email: user.email,
            userId: user._id.toString(), // If the user is autorised then we create a Json Web Token
            role: company != null ? "verker" : "user",
            //The following is the secret key, that can unlock the token cryptation
        }, jwtHt, {
            // expiresIn: '1h'
        }); 

        const userToken = serverClient.createToken(user._id.toString());

        console.log(userToken);

        const response = await serverClient.upsertUsers([{  
            id: user._id.toString(),  
            role: 'user',  
            firstName: user.firstName,
            lastName: user.lastName,
            
        }]);

        return {
            jwt: jsonWebToken,
            verker: company != null,
            user: {
                ...user._doc,
                streamToken: userToken
            },
        }

    },
    createProject: async function ({
        projectInput
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

        console.log(result);
        return {
            ...result._doc,

            _id: result._id.toString(),
        }


    },
    getProjects: async function ({
        non
    }, req) {
        if (!req.isUser) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        const project = await ProjectModel.find({
            consumerId: req.userId
        });

        if (!project) {
            throw new Error(errorType.NO_PROJECTS)
        }

        return project

    },
    getOutreaches: async function ({}, req) {
        if (!req.isUser) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        const outreaches = await OutreachModel.find({
            consumerId: req.userId
        });

        for (var i in outreaches) {

            outreaches[i]['messages'] = await MessageModel.find({
                outreachId: outreaches[i]._id
            }).sort({
                createdAt: -1
            }).limit(10);
        }



        return outreaches
        // return outreaches

    },
    createOutreach: async function ({
        outreachInput
    }, req) {

        if (!req.isVerker) {
            const error = new Error('NOT_VERKER')
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

        if (user.companyId.roles.get(req.userId) != 'Owner') {
            const error = new Error('NEED_OWNER_ACCOUNT')
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
            "$push": {
                outreaches: savedOutreach._id,
            }
        };

        const pushOutreachesToCompany = {
            "$push": {
                outreaches: {
                    outreachId: savedOutreach._id,
                    projectId: project._id,
                }
            }
        };

        await project.updateOne(pushOutreachesToProject);

        await CompanyModel.findOneAndUpdate({
            _id: user.companyId._id
        }, pushOutreachesToCompany)

        console.log(savedOutreach._id);

        const channel = await serverClient.channel('messaging',savedOutreach._id.toString(), {
            image: user.profileImage,
            members: [project.consumerId._id.toString(), req.userId],
            created_by_id: req.userId,
            companyName: user.companyId.name,
            verkerName: user.firstName,
            projectTitle : project.title,
            projectId : project._id,
            outreachId : savedOutreach._id,
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
}