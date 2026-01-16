import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,//30 days
};

//helper function to create JWT with 
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({
            "message" : "Please Provide all required fields"
        })
    }

    //Check if the user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0) {
        return res.status(400).json({ "message": "User Already Exists" });
    }

    //now that we know we have a new user, start hashing their password : 
    const hashedPassword = await bcrypt.hash(password, 10);


    //create new user into the DB : 
    const newUser = await pool.query(
        'INSERT INTO users (username, email, password) values ($1, $2, $3) RETURNING id, username   , email', [username, email, hashedPassword]
    );

    //generate jwt token with the same id as the entry int the database
    const token = generateToken(newUser.rows[0].id);

    //create & attach a cookie of the name `token` carrying the jwt token
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({ user: newUser.rows[0] });
});



router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: 'Please Provide all required fields'
        })
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length == 0) {
        return res.status(400).json({ message: 'User Does Not Exist' });
    };

    const userData = user.rows[0];

    const doesPasswordMatch = await bcrypt.compare(password, userData.password);

    if (!doesPasswordMatch) {
        return res.status(400).json({ message: 'Incorrect Password' });
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);

    return res.json({
        user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
        }
    });
})

//me
router.get('/me', protect , async (req, res) => {
    //TODO: use middleware to return data of of logged in user only.
    res.json(req.user);
})

//login
router.post('/logout', (req, res) => {
    //set the `token` cookie with a blank string, and a very short expiry age.
    res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
    return res.json({ message: 'logged Out Successfully' });
});

export default router;