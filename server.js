import express from "express";
const app = express();
import "dotenv/config";

const PORT = process.env.PORT || 5000;

app.get("/", (req, res)=>{
    return res.status(200).send({
        message : "It is working fine..........."
    })
})

app.listen(PORT,()=>{
    console.log(`Server start on PORT: ${PORT}`)
})
