const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../service/schemas/user");

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const signup = async (req, res, next) => {
  console.log('Request received at /signup');
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
    const newUser = await User.create({ email, password: hashedPassword });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
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

    console.log('JWT_SECRET:', process.env.JWT_SECRET);  // Dodaj to logowanie

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

module.exports = {
  signup,
  login,
  logout,
  current,
};
