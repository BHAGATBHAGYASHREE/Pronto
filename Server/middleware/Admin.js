// import UserModel from "../models/user.model.js"

// export const admin = async(request,response,next)=>{
//     try {
//        const  userId = request.userId

//        const user = await UserModel.findById(userId)

//        if(user.role !== 'ADMIN'){
//             return response.status(400).json({
//                 message : "Permission denial",
//                 error : true,
//                 success : false
//             })
//        }

//        next()

//     } catch (error) {
//         return response.status(500).json({
//             message : "Permission denial",
//             error : true,
//             success : false
//         })
//     }
// }

import UserModel from "../models/user.model.js";

export const admin = async (request, response, next) => {
    try {
        // Get userId from the request (assuming it's added during authentication)
        const userId = request.userId;

        // Fetch the user from the database by ID
        const user = await UserModel.findById(userId);

        // Check if the user's role is ADMIN
        if (user.role !== 'ADMIN') {
            return response.status(403).json({
                message: "Permission denied: Admins only",
                error: true,
                success: false
            });
        }

        // Proceed to the next middleware or route handler if the user is an admin
        next();
    } catch (error) {
        console.error("Error in admin middleware:", error);
        return response.status(500).json({
            message: "Permission denied: Unable to verify admin",
            error: true,
            success: false
        });
    }
};
