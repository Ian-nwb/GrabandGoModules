const authService = require('./auth.service');

const register = async (req, res) => {
  const { email, password, firstName, middleName, lastName, birthday, phone } = req.body;

  if (!email || !password || !firstName || !lastName || !birthday || !phone) {
    const err = new Error('Email, password, first name, last name, birthday, and phone are required');
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.registerUser(email, password, {
    firstName,
    middleName,
    lastName,
    birthday,
    phone
  });
  res.status(201).json({ message: 'User registered successfully', user: result });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.loginUser(email, password);
  res.status(200).json({ message: 'Login successful', ...result });
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    const err = new Error('Both old and new passwords are required');
    err.statusCode = 400;
    throw err;
  }

  // req.user is injected safely via the protect middleware
  const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
  res.status(200).json(result);
};

module.exports = {
  register,
  login,
  changePassword
};