import express from "express";
const app = express();
import "dotenv/config";

import mongooseConnection from "./DB/db.config.js"

const PORT = process.env.PORT || 5000;

//* Middleware

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get("/", (req, res)=>{
    return res.status(200).send({
        message : "It is working fine..........."
    })
})

/** Imports Api router */

import ApiRoutes from './routes/api.js';

app.use("/api", ApiRoutes)

app.listen(PORT,()=>{
    console.log(`Server start on PORT: ${PORT}`)
})


