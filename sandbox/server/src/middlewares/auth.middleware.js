import { verifyToken } from "../utils.js";


export function authMiddleware(req, res, next){

    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
    
    if (!token){
        return res.status(401).json({error: "Unauthorized"})
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken){
        return res.status(401).json({error: "Unauthorized"})
    }

    req.user = decodedToken; 
    next();
}