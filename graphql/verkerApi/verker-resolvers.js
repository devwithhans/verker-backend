require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const VerkerModel = require('../../models/verker-model');
const ProjectModel = require('../../models/project-model');
const CompanyModel = require('../../models/company-model');


const jwtHt = process.env.JWT_TOKEN;

module.exports = {
    signinVerker: async function ({
        email,
        password
    }) {
        const verker = await VerkerModel.findOne({
            email: email
        });
        if (!verker) {
            const error = new Error('No verker was found');
            error.statusCode = 404;
            throw error;
        }

        const pwMatch = await bcrypt.compare(password, verker.password);

        if (!pwMatch) {
            const error = new Error('password was incorrect');
            error.statusCode = 404;
            throw error;
        }

        const jsonWebToken = await jwt.sign({
            email: verker.email,
            userId: verker._id.toString(),
            role: "verker",
            //The following is the secret key, that can unlock the token cryptation
        }, jwtHt, {
            expiresIn: '1h'
        });

        return {
            _id: verker._id.toString(),
            jwt: jsonWebToken,
        }
    },
    createCompany: async function ({
        companyInput
    }, req) {

        if(!req.isVerker){
            const error = new Error('Need to be signed in');
            throw error;
        }

        const existingCompany = await CompanyModel.findOne({
            cvr: companyInput.cvr
        });

        if (existingCompany) {
            const error = new Error('Company already exists');
            throw error;
        }


        const verker = await VerkerModel.findById(req.userId);

        if (!verker) {
            const error = new Error('Failed to find verker');
            throw error;
        }

        if (verker.companyId) {
            const error = new Error('you already have a company');
            throw error;
        }

        const newCompany = new CompanyModel({
            name: companyInput.name,
            description: companyInput.description,
            cvr: companyInput.cvr,
            email: companyInput.email,
            phone: companyInput.phone,
            employees: companyInput.employees,
            established: companyInput.established,
            totalProjects: companyInput.totalProjects,
            owner: {
                ownerId: verker._id,
                firstName: verker.firstName,
                lastName: verker.lastName,
                profileImage: verker.profileImage,
            },
            address: companyInput.address,
        })

        const company = await newCompany.save();

        verker.companyId = company._id;

        await verker.save();


        return {
            ...company._doc,
            _id: company._id.toString()
        }




    },
    createVerker: async function ({
        verkerInput,
    }) {
        const existingVerker = await VerkerModel.findOne({
            email: verkerInput.email
        });

        if (existingVerker) {
            if (existingVerker.password) {
                const error = new Error('Verker already exists');
                throw error;
            }
            const hashedPw = await bcrypt.hash(verkerInput.password, 12);
            existingVerker.password = hashedPw;
            existingVerker.firstName = verkerInput.firstName;
            existingVerker.lastName = verkerInput.lastName;
            existingVerker.profileImage = verkerInput.profileImage;
            existingVerker.address = verkerInput.address;
            existingVerker.phone = verkerInput.phone;
            existingVerker.deviceToken = verkerInput.deviceToken;

            const updatedVerker = await existingVerker.save();

            return {
                ...updatedVerker._doc,
                _id: updatedVerker._id.toString()
            }
        }

        const hashedPw = await bcrypt.hash(verkerInput.password, 12);
        const newVerker = new VerkerModel({
            firstName: verkerInput.firstName,
            lastName: verkerInput.lastName,
            profileImage: verkerInput.profileImage || "https://s.starladder.com/uploads/team_logo/d/4/d/3/ce3c2349c7e3a70dac35cf4a28c400b9.png",
            deviceToken: verkerInput.deviceToken,
            address: verkerInput.address,
            email: verkerInput.email,
            phone: verkerInput.phone,
            password: hashedPw,
        });

        const verker = await newVerker.save();

        return {
            ...verker._doc,
            _id: verker._id.toString()
        }

    },
    inviteVerker: async function ({email}, req){
        if(!req.isVerker){
            const error = new Error('You must be verker');
            throw error;
        }
        const currentVerker = await VerkerModel.findById(req.userId);

        const company = await CompanyModel.findById(currentVerker.companyId);
        if(!company){
            const error = new Error('I seems that you are are not connected to a company');
            throw error;
        }
        if(company.owner.ownerId !== req.userId){
            const error = new Error('You need to be the owner of the company to invite');
            throw error;  
        }
        console.log(company.employeeInvite);
        if(company.employeeInvite.includes(email)){
            const error = new Error('You allready invited this verker');
            throw error;  
        }
        

        const verkerExists = await VerkerModel.findOne({email: email});

        if(!verkerExists){
            const newVerker = new VerkerModel({
                email: email,
                companyInvite: {
                    companyName: company.name,
                    companyId: company._id
                }
            });
            await newVerker.save();
            company.employeeInvite.push(email);
            await company.save();
            return "You sent an invitation to email";
        }
            verkerExists.companyInvite = {
                companyName: company.name,
                companyId: company._id
            };
            await verkerExists.save();
            company.employeeInvite.push(email);
            await company.save();
            return "You sent an invitation to email";
        


    }


}