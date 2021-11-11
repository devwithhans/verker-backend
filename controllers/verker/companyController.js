// const CompanyModel = require('../../models/companyModel');



exports.registerCompany = (req, res, next) => {
    const companyName = req.body.companyName;
    const cvr = req.body.cvr;
    const employees = req.body.employees;
    const established = req.body.established;
    const ownerFirstName = req.body.ownerFirstName;
    const ownerLastName = req.body.ownerLastName;
    const ownerId = req.body.ownerId;
    const infoEmail = req.body.infoEmail;
    const infoPhone = req.body.infoPhone;
    const logo = req.body.logo;
    const business = req.body.business;
    const roles = req.body.roles;
    const bio = req.body.bio;   
    
    const company = new CompanyModel({
        companyName: companyName,
        cvr: cvr,
        employees: employees,
        established: established,
        ownerFirstName: ownerFirstName,
        ownerLastName: ownerLastName,
        ownerId: ownerId,
        infoEmail: infoEmail,
        infoPhone: infoPhone,
        logo: logo,
        business: business,
        roles: roles,
        bio: bio,
    });

    company.save().then((result) => {
        res.json({message: 'Company was succesfully created', data: result});
    }).catch((err) => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })

}