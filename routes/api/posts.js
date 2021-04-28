const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route  POST api/posts
//@desc   Create a post
//@access Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // get logged-in user
      const user = await User.findById(req.user.id).select('-password');
      // create post object
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      // declare new post to post field
      const post = await newPost.save();

      // save post
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error with Post API Route');
    }
  }
);

//@route  GET api/posts
//@desc   Get all post
//@access Private
router.get('/', auth, async (req, res) => {
  try {
    // find post from Post model and sort by date to get most recent
    const posts = await Post.find().sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Get Post Server Error');
  }
});

//@route  GET api/posts/:id
//@desc   Get post by ID
//@access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    res.status(500).send('Single User Post Server Error');
  }
});

//@route  Delete api/posts/:id
//@desc   Delete post by ID
//@access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    //delete post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    // check user, will need to convert post user object to string
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete post' });
    }
    // returns a promise to remove the post
    await post.remove();
    // return message to confirm post removed
    res.json({ msg: 'Post has been removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    res.status(500).send('Delete Post Server Error');
  }
});

//@route  PUT api/posts/like/:id
//@desc   Like post by ID
//@access Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'This post is already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
