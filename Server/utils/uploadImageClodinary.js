import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name :'daue2bmlu',
    api_key : '783795849288538',
    api_secret : 'X_hMkjd5-TXq9UmYn3rqG6ULwsA'
})

const uploadImageClodinary = async(image)=>{
    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer())

    const uploadImage = await new Promise((resolve,reject)=>{
        cloudinary.uploader.upload_stream({ folder : "pronto"},(error,uploadResult)=>{
            return resolve(uploadResult)
        }).end(buffer)
    })

    return uploadImage
}

export default uploadImageClodinary
