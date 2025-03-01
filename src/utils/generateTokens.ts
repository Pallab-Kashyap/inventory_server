import { error } from "console";
import jwt from "jsonwebtoken";
import APIError from "./APIError";

export const generateAccessToken = (payload: {}) => {
try {
        if(!payload){
            throw error('payload missing for token generation')
        }
    
        const secret = process.env.ACCESS_TOKEN_SECRET;
    
        if(!secret){
            throw error('ENV missing for token generation')
        }
    
        const token = jwt.sign(payload, secret, { expiresIn: '5d'})
    
        return token
} catch (error) {
    throw error
}
}

export const generateRefershToken =  (payload: {}) => {
try {
        if(!payload){
            throw error('payload missing for token generation')
        }
    
        const secret = process.env.ACCESS_TOKEN_SECRET;
    
        if(!secret){
            throw error('ENV missing for token generation')
        }
    
        const token = jwt.sign(payload, secret, { expiresIn: '15d'})
    
        return token
} catch (error) {
    throw error
}
}

export const verifyToken = (token: string) => {
try {
    
        const secret = process.env.ACCESS_TOKEN_SECRET;
    
        if(!secret){
            throw error('ENV missing for token generation')
        }
    
        const user = jwt.verify(token, secret)
    
        return user
} catch (error) {
    console.log(error);
    throw error
}
}