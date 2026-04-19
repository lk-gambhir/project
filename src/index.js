import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path : '.env'
})
connectDB()
.then(() => {
    app.on("error",(err) => {
        console.log("There is an error : ",err)
        throw err
    })
    app.listen(process.env.PORT || 8000), () => {
        console.log("Process is running on port : ", process.env.PORT)
    }
})
.catch((err) => {
    console.log("MONGODB connection failed. ",err)
});














/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";


import express from "express";
const app = express();

(async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`) 
       
       app.on("error", () => {
        console.log("ERROR: ",error)
        throw error
       })
       app.listen(process.env.PORT,() => {
            console.log(`Application is listening on port ${process.env.PORT}`)
       })
    } catch (error) {
        console.error("Error :" , error)
        throw error
    }
})()
*/