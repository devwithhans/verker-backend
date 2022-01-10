require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const UserModel = require('../../models/user-model');
const ProjectModel = require('../../models/project-model');
const OutreachModel = require('../../models/outreach-model')
const MessageModel = require('../../models/message-model');

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


        return {
            ...user._doc,
            _id: user._id.toString(),
        }

    },
    singleUser: async function ({
        id
    }, req) {
        if (!req.isUser) {
            const error = new Error('Not authorized');
            error.statusCode = 404;
            throw error;
        }
        const user = await UserModel.findById(id);
        if (!user) {
            const error = new Error('User was not found');
            error.statusCode = 404;
            throw error;
        }
        return {
            ...user._doc,
            _id: user._id.toString()
        };
    },
    signinUser: async function ({
        email,
        password
    }) {
        const user = await UserModel.findOne({
            email: email
        });
        if (!user) {
            const error = new Error('No user was found');
            error.statusCode = 404;
            throw error;
        }

        const pwMatch = await bcrypt.compare(password, user.password);

        if (!pwMatch) {
            const error = new Error('PASSWORD_IS_INCORRECT');
            error.statusCode = 404;
            throw error;
        }

        const jsonWebToken = await jwt.sign({
            email: user.email,
            userId: user._id.toString(),
            role: "user",
            //The following is the secret key, that can unlock the token cryptation
        }, jwtHt, {
            expiresIn: '1h'
        });

        return {
            _id: user._id.toString(),
            jwt: jsonWebToken
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
    getMessages: async function ({
        outreachId
    }, req) {
        const messages = await MessageModel.find({
            outreachId: outreachId
        }).sort({
            createdAt: -1
        });

        if (!messages) {
            throw new Error('NO_MESSAGES')
        }

        io = require('../../socket').getIO();

        await OutreachModel.findOneAndUpdate({
            _id: outreachId,
            "members.userId": req.userId
        }, {
            $set: {
                'members.$.totalUnread': 0
            }
        });
        console.log('CALLED MESSAGES HOW THA FUCK DO I FIX THIS????: ' + messages);


        return messages

    },
    sendMessage: async function ({
        messageInput
    }, req) {
        // if (!req.isUser) {
        //     const error = new Error('NOT_VERKER')
        //     throw error;
        // }
        io = require('../../socket').getIO();

        const message = new MessageModel({
            outreachId: messageInput.outreachId,
            message: messageInput.message,
            senderId: req.userId
        });
        const savedMessage = await message.save();



        await OutreachModel.findOneAndUpdate({
                _id: messageInput.outreachId
            }, {
                $inc: {
                    "members.$[members].totalUnread": 1
                }
            }, {
                arrayFilters: [{
                    "members.userId": {
                        $ne: req.userId
                    }
                }],
                multi: true
            }

        )

 io.to(messageInput.socketNotification).emit('message', {
            type: 'newMessage',
            data: {
            ...savedMessage._doc,
            senderName: messageInput.senderName,

        }
        });

        console.log(savedMessage.createdAt);

        return  {
            ...savedMessage._doc,
            senderName: messageInput.senderName,
            createdAt: savedMessage.createdAt.toString(),
        }
        
    
    },
    isTyping: async function ({
        isTyping,
        socketNotification,
        name,
        outreachId,
    }, req) {
        io = require('../../socket').getIO();
        io.to(socketNotification).emit('message', {
            type: 'typing',
            data: {
                isTyping: isTyping,
                name: name,
                outreachId: outreachId,
            }
        });
        return isTyping;
    }
}