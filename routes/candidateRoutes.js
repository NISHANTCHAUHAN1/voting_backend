const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');
// const Candidate = require('../models/candidate');
const Candidate = require('../models/candidate');

const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId)
        if(user.role === 'admin') {
            return true
        }
    } catch (error) {
        return false;
    }
}

// post route to add a candidate
router.post('/', jwtAuthMiddleware, async (req,res) => {
    try {
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body
        const newCandidate = new Candidate(data);

        const response = await newCandidate.save();
        console.log("data saved");

        res.status(200).json({response: response});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Internal ServerError"})
    }
})

// update
router.put('/:candidateID', jwtAuthMiddleware, async(req,res) => {
    try {
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const candidateID = req.params.candidateID; // Extract the id from Url parameter
        const updatedCandidateData = req.body;  // updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if(!response) {
            return  res.status(404).json({ error: 'Candidate not found' });
        }
        console.log('candidate data updated');
        res.status(200).json(response);

    } catch (error) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

//delete candidate

router.delete('/:candidateID', jwtAuthMiddleware, async (req,res) => {
    try {
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const candidateID = res.params.candidateID

        const response = await Candidate.findByIdAndDelete(candidateID);
        if(!response) {
            return res.status(404).json({error: 'Candidate not found'});
        }
        console.log('candidate deleted');
        res.status(200).json(response)

    } catch (error) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// voting count logic

router.post('/vote/:candidateID', jwtAuthMiddleware, async (req,res) => {

    const candidateID = req.params.candidateID;
    const userId = req.user.id;
    try {
        const candidate = await Candidate.findById(candidateID);
        if(!candidate) {
            return res.status(404).json({message: "Candidate not found"})
        }

        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: "Candidate not found"})
        }
        if(user.isVoted) {
            return res.status(400).json({ message: 'You have already voted' });
        }
        if(user.role == 'admin') {
            return res.status(403).json({ message: 'admin is not allowed'});
        }

        // Update the Candidate document to record the vote
        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save()

        // update the user document
        user.isVoted = true;
        await user.save()

        res.status(200).json({message: "Vote recorded succesfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Internal Server Error"});
    }
})

// vote count
router.get('/vote/count', async(req,res) => {
    try {
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'descending'})

         // Map the candidates to only return their name and voteCount
         const voteRecord = candidate.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
         });
         res.status(200).json(voteRecord)
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Internal Server Error"});
    }
})

router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find({}, 'name party');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;