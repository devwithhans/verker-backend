require('dotenv').config();

var aws = require('aws-sdk');
const express = require('express');


// MULTER: 
var multer = require('multer')
var multerS3 = require('multer-s3')
var sharp = require('sharp')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY


var s3 = new aws.S3({
    region,
    accessKeyId,
    secretAccessKey,
})

var router = express.Router()


var uploadProjectFiles = () => {
    const folderName = "projectFiles/" + Date.now().toString();
    return multer({
        storage: multerS3({
            s3: s3,
            bucket: bucketName,
            key: function (req, file, cb) {
                // cb(null, folderName+"/"+Date.now().toString()+".jpg")
                if(file.mimetype.split('/')[0] == "image"){
                    cb(null, folderName + req.userId + "/"+Date.now().toString()+".jpg")
                } else if(file.mimetype.split('/')[0] == "video"){
                    console.log(file.mimetype.split('/')[1]);
                    cb(null, folderName + req.userId +"/"+Date.now().toString()+".mp4")
                }
            },
        })
    });
}



var uploadProfileImages = () => {
    const folderName = "profileImages/";
    return multer({
        storage: multerS3({
            s3: s3,
            bucket: bucketName,
            shouldTransform: true,
            transforms: [{
                id: 'original',
                key: function (req, file, cb) {
                        cb(null, folderName+req.userId+".jpg")
                },
                transform: function (req, file, cb) {
                        cb(null, sharp().resize(100, 100).jpeg())
                }
    
            }]
        })
    });
}

// router.use("/", (req, res, next) => {
//     if(!req.isUser){
//         const error = new Error("Need to be user for uploading files");
//         next(error);
//     }
//     next();
// })



router.post('/uploadProjectFiles', uploadProjectFiles().array('files'), (req, res, next) => {
    console.log('thispoint');
    const paths = [];
    for(var i in req.files){
        paths.push(req.files[i].key);
    }
    
    res.status(200).json({
        path: paths,
    })

    console.log(paths);

})

router.post("/profileImage", uploadProfileImages().single('files'), (req, res, next) => {
    res.status(200).json({
        // data: req.files,
        somethingElse: "asd",
        path: req.file.transforms[0].key,
    })
})

router.get("/image/:key(*)", (req, res, next) => {
    const key = req.params.key;
     var params = {
        Bucket: bucketName, /* required */
        Key: key, /* required */
    };
    s3.headObject(params, function(err, data) {
    if (err) {
        console.log(err, err.stack);
        return;
    }
     if (req != null && req.headers.range != null)
    {
        var range = req.headers.range;
        var bytes = range.replace(/bytes=/, '').split('-');
        var start = parseInt(bytes[0], 10);

        var total = data.ContentLength;
        var end = bytes[1] ? parseInt(bytes[1], 10) : total - 1;
        var chunksize = (end - start) + 1;

        res.writeHead(206, {
           'Content-Range'  : 'bytes ' + start + '-' + end + '/' + total,
           'Accept-Ranges'  : 'bytes',
           'Content-Length' : chunksize,
           'Last-Modified'  : data.LastModified,
           'Content-Type'   : data.ContentType
        });

        s3.getObject({Bucket: bucketName, Key: key, Range: range}).createReadStream().pipe(res);
    }
    else
    {
        res.writeHead(200, 
        { 
            'Content-Length': data.ContentLength, 
            'Last-Modified' : data.LastModified,
            // 'Content-Type'  : data.ContentType 
        });
        s3.getObject({Bucket: bucketName, Key: key }).createReadStream().pipe(res);
    }



    });


})

exports.getFileStream = function getFileStream(fileKey){

    console.log(fileKey, "   ", bucketName)

    const downloadParams = {

    }

    var params = {
        Bucket: bucketName, /* required */
        Key: fileKey, /* required */
        Range: 'bytes=0-'
};

    s3.headObject(params, function(err, data) {
    if (err) {
        console.log(err, err.stack);
        return;
    }
    console.log(data)
    });

    return s3.getObject(params).createReadStream();

}

exports.router = router
        // res.writeHead(200, 
        // { 
        //     'Cache-Control' : 'max-age=' + cache + ', private',
        //     'Content-Length': data.Contents[0].Size, 
        //     'Last-Modified' : data.Contents[0].LastModified,
        //     'Content-Type'  : mimetype 
        // });