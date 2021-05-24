const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

//@route  Get api/profile/me
//@desc   Get current users profile
//@access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    // check if no profile
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for that user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error API Route');
  }
});

//@route  POST api/profile
//@desc   Create or update a user profile
//@access Private
router.post(
  '/',
  [
    auth,
    [check('status', 'Status is required').not().isEmpty()],
    check('skills', 'Skills is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills
        .toString()
        .split(',')
        .map((skill) => skill.trim());
    }
    // build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    // insert fields into database
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      // look for profile
      if (profile) {
        // update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }
      // create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  GET api/profile
//@desc   Get all profiles
//@access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.err(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  GET api/profile/user/:user_id
//@desc   Get profile by user ID
//@access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route  DELETE api/profile
//@desc   Delete profile, user & posts
//@access Private
router.delete('/', auth, async (req, res) => {
  try {
    // remove users posts
    await Post.deleteMany({ user: req.user.id });

    // remove profile
    await Profile.findOneAndRemove({
      user: req.user.id,
    });
    // remove user
    await User.findOneAndRemove({
      _id: req.user.id,
    });
    // return
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/expierence
//@desc   Add profile experience
//@access Private

router.put(
  '/experience',
  [
    auth,
    [check('title', 'Title is required').not().isEmpty()],
    [check('company', 'Company is required').not().isEmpty()],
    [check('from', 'From date is required').not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      // find existing profile in database by user id from token
      const profile = await Profile.findOne({ user: req.user.id });
      // add array to unshift to the beginning to capture most recent
      profile.experience.unshift(newExp);
      await profile.save();
      //return the updated profile
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
//@route  DELETE api/profile/expierence/:exp_id
//@desc   Delete profile experience
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    // get the profile of the logged in user
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index that matches the experience id
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    // check to see if experience id exists
    if (removeIndex === -1) {
      return res.status(400).json({
        msg: 'No such entity',
      });
    }
    // remove the experience
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/education
//@desc   Add profile education
//@access Private
router.put(
  '/education',
  [
    auth,
    [check('school', 'School is required').not().isEmpty()],
    [check('degree', 'Degree is required').not().isEmpty()],
    [check('fieldofstudy', 'Field of Study is required').not().isEmpty()],
    [check('from', 'From date is required').not().isEmpty()],
  ],
  async (req, res) => {
    // check for errors in req body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // desctructure the eduction req body
    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    // capture new values for updated education
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      // find existing profile in database by user id from token
      const profile = await Profile.findOne({ user: req.user.id });
      // add array to unshift to the beginning to capture most recent
      profile.education.unshift(newEdu);
      await profile.save();
      //return the updated profile
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/education/:edu_id
//@desc   Delete profile education
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    // get the profile of the logged in user
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index that matches the experience id
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    // check to see if education id exists
    if (removeIndex === -1) {
      return res.status(400).json({
        msg: 'No such entity',
      });
    }
    // remove the experience
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  GET api/profile/github/:username
//@desc   GET user repos from githu
//@access Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github user profile found' });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Github API Server Error');
  }
});

module.exports = router;
