
const UserModel = require('../../models/user-model');


exports.getUserInfo = (req, res, next) => {
    UserModel.findById(req.userId).then((user) => {
        if(!user){
            const error = new Error('No user found');
            error.statusCode = 404;
            throw error;
        }
        
        res.status(200).json({userData: user, role: req.role});

    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}