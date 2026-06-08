const User = require('./user.model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const registerUser = async (email, password) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error('User already exists');
    err.statusCode = 409;
    throw err;
  }

  // Model hook handles the hashing automatically!
  const newUser = await User.create({ email, password });
  return { id: newUser._id, email: newUser.email };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  // Use our new model method
  if (!user || !(await user.matchPassword(password))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
  return { token, user: { id: user._id, email: user.email } };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user || !(await user.matchPassword(oldPassword))) {
    const err = new Error('Invalid user or incorrect current password');
    err.statusCode = 401;
    throw err;
  }

  user.password = newPassword; // The pre-save hook will hash this new password
  await user.save();

  return { message: 'Password updated successfully' };
};

module.exports = { registerUser, loginUser, changePassword };