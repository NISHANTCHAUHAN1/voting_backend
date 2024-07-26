const express = require('express');
const router = express.Router();
const User = require('./../models/user')
const {jwtAuthMiddleware, generateToken} = require('./../jwt');

// sign up
router.post('/signup', async (req, res) => {
    try {
        const data = req.body;  // Assuming the request body contains the User data

        //Create a new User documnet using the Mongoose model
        const newUser = new User(data)

        // Save the new user in the database
        const response = await newUser.save();
        console.log('data saved');

        const payload = {
            id: response.id,
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload)
        console.log("token is", token);

        res.status(200).json({response: response, token: token})
    } catch (error) {
        console.log(error);
        res.status(400).json({error: "Internl Server Error"})
    }
})

// login
router.post('/login', async(req, res) => {
    try {
        // Extract aadharCardNumber and password from req body
        const {aadharCardNumber, password} = req.body;

        // find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        if(!user || !(await user.comparePassword(password))) {
            return res.status(400).json({error: 'Invails username or password'})
        }

        // get token
        const payload = {
            id: user.id,
        }
        const token = generateToken(payload)
        res.json({token})

    } catch (error) {
        console.log(error);
        res.status(400).json({error: "Internal server error"})
    }
})

// profile
router.post('/profile', jwtAuthMiddleware, async (req,res) => {
    try {
        const UserData = req.user;
        console.log( "userdata" ,UserData);

        const userId = UserData.id;
        const user = await User.findById(userId)
        res.status(200).json({user});
    } catch (error) {
        console.log(error);
        res.status(400).json({error: "Internal Server Error"})
    }
})

// update password

router.put('/profile/password', jwtAuthMiddleware, async(req, res) => {
    try {
        const userId = req.user.id;  // Extract id from the token with the help of middleweare
    const {currentPaaword, newPassword} = res.body //Extract current and new passwords from request body

    // find the user by the userID
    const user = await User.findById(userId);

    if(!(await comparePassword(currentPaaword))) {
        return res.status(401).json({error: "Invails username and password"})
    }

    // update the user password
    user.password = newPassword;
    await user.save();

    console.log("Password updated");
    res.status(200).json({message: "password Updated"})
    } catch (error) {
        console.log(error);
        res.status(400).json({error: "Internal Serevr error"})
    }
})

module.exports = router;