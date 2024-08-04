const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require('jimp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');
const User = require("../service/schemas/user");

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const signup = async (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({ email, password: hashedPassword, avatarURL });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.token = token;
    await user.save();

    res.json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const current = async (req, res, next) => {
  try {
    res.json({
      email: req.user.email,
      subscription: req.user.subscription,
    });
  } catch (err) {
    next(err);
  }
};

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const updateAvatar = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { path: tempUpload, originalname } = req.file;
  const { _id: id } = req.user;
  const avatarName = `${id}-${uuidv4()}-${originalname}`;
  const resultUpload = path.join(avatarsDir, avatarName);

  try {
    const image = await Jimp.read(tempUpload);
    await image.resize(250, 250).writeAsync(resultUpload);
    await fs.unlink(tempUpload);

    const avatarURL = `/avatars/${avatarName}`;
    await User.findByIdAndUpdate(id, { avatarURL });

    res.json({ avatarURL });
  } catch (error) {
    console.error('Error processing avatar:', error);
    await fs.unlink(tempUpload);
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  current,
  updateAvatar,
};
