import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;  
//middlewares
app.use(express.json());
app.use(cookieParser());


app.get("/", (req,res) =>{
    res.send("Hello.world");
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})