const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require('jimp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');
const User = require("../service/schemas/user");
const mailgun = require('mailgun-js');

const DOMAIN = process.env.MAILGUN_DOMAIN;
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `http://localhost:3000/api/users/verify/${verificationToken}`;
  const data = {
    from: 'Someone <no-reply@your-domain.com>',
    to: email,
    subject: 'Email Verification',
    text: `Please verify your email by clicking the following link: ${verificationLink}`,
    html: `<h1>Hi there! You made it!</h1><p>Please verify your email by clicking the following link: <a href="${verificationLink}">${verificationLink}</a></p>`
  };

  await mg.messages().send(data);
};

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
    const verificationToken = uuidv4();
    const newUser = await User.create({ email, password: hashedPassword, avatarURL, verificationToken });

    await sendVerificationEmail(email, verificationToken);

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
    await fs.unlink(tempUpload);
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verify = true;
    delete user.verificationToken;
    await user.save();

    res.status(200).json({ message: 'Verification successful' });
  } catch (err) {
    next(err);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({ message: "Verification has already been passed" });
    }

    await sendVerificationEmail(email, user.verificationToken);

    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  logout,
  current,
  updateAvatar,
  verifyEmail,
  resendVerificationEmail,
};
