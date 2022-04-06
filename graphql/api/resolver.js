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
const CompanyModel = require('../../models/company-model');


const {
    errorName,
    errorType
} = require('../constants');
const { options } = require('request');

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
            verker: true,
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

        if (!user) {
            throw new Error(errorName.EMAIL_NOT_FOUND);;
        }
        
        let company;
        if(user.companyId){
            if(verker && user.companyId.toString().length == 24){
                console.log(verker);
                company = await CompanyModel.findById(user.companyId);
            }
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
            companyId: user.companyId ??= ''
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
            image: user.profileImage,
            
        }]);



        return {
            jwt: jsonWebToken,
            verker: company != null,
            user: {
                ...user._doc,
                verker: company != null,
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
        if (!req.isUser && !req.isVerker) {
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

        for (var i in user.companyId.outreaches) {
            if (user.companyId.outreaches[i].projectId.toString() == project._id.toString()) {
                const error = new Error(errorName.ALREADT_OUTREACHED);
                throw error;
            }
        }

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





    browseProjects: async function ({
            limit,
            skip,
            coordinates,
            maxDistance,
            type
        }, req) {
            if (!req.isVerker) {
                const error = new Error(errorName.NOT_VERKER);
                throw error;
            }
            console.log(limit, skip, coordinates, maxDistance, type);

            const company = await CompanyModel.findById(req.companyId);

            if(!company) throw new Error(errorName.NOT_VERKER)

            var outreachIds = company.outreaches.map(function(item) {
                return item.projectId;
              });

            let query = {
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: coordinates,
                        },
                        $maxDistance: maxDistance,
                    },
                },
                projectType: type,
                _id: {
                    $nin: outreachIds
                }


            };



            // We find the projects for the current user
            const projects = await ProjectModel.find(query).limit(limit).skip(skip);


            // if (projects.length === 0) {
            //     const error = new Error('NO_PROJECTS');
            //     throw error;
            // }


            for (var i in projects) {
                var distance = await getDistanceFromLatLonInKm(projects[i]['location']['coordinates'][0], projects[i]['location']['coordinates'][1], coordinates[0], coordinates[1])
                Object.assign(projects[i], {
                    'distance': distance
                });
            }


            return projects;

        },
    verkerGetProjects: async function ({}, req){
        console.log(req.isVerker);
        if (!req.isVerker) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        const outreaches = await OutreachModel.find({
            companyId: req.companyId,
        }).populate('projectId').sort([['updatedAt', -1]]);

        var result = [];
        for(var i in outreaches) {
            result.push({
                project: outreaches[i].projectId, 
                outreach: outreaches[i],
            })
        }
        console.log(result);

        return result;


    }
}



function getDistanceFromLatLonInKm(lon1, lat1, lon2, lat2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}





