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

//@route  PUT api/posts/unlike/:id
//@desc   Unlike post by ID
//@access Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }
    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    // splice the array
    post.likes.splice(removeIndex, 1);
    await post.save();

    // return the likes
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

//@route  POST api/posts/comment/:id
//@desc   Comment on a post
//@access Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // get the user by Id
      const user = await User.findById(req.user.id).select('-password');
      // get the post by Id
      const post = await Post.findById(req.params.id);

      // create post object
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      // declare new post to post field
      await post.save();

      // save post
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error with Post API Route');
    }
  }
);

//@route  DELETE api/posts/comment/:id/:comment_id
//@desc   Delete comment from post
//@access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    // get the post by Id
    const post = await Post.findById(req.params.id);

    // pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // check if comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // check that user is owner of comment
    if (comment.user.toString() !== req.user.id)
      return res
        .status(401)
        .json({ msg: 'User is not authorized to delete comment' });

    // Get remove index
    const removeIndex = post.comments
      .map((coment) => comment.user.toString())
      .indexOf(req.user.id);
    // splice the array
    post.comments.splice(removeIndex, 1);
    await post.save();

    // return the comments
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error with Delete Comment API Route');
  }
});

module.exports = router;
