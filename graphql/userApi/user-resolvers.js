require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const UserModel = require('../../models/user-model');
const ProjectModel = require('../../models/project-model');

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
            const error = new Error('password was incorrect');
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


    }
}