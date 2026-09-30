import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

class AuthService {
  async registerUser({ name, email, password, role, phone, organization }) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.errorCode = 'USER_EXISTS';
      throw err;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'viewer',
      phone: phone || '',
      organization: organization || 'Disaster Management Authority',
    });

    const token = generateToken({ id: user._id, role: user.role });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async loginUser({ email, password }) {
    if (!email || !password) {
      const err = new Error('Please provide both email and password.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Your account is deactivated. Contact an administrator.');
      err.statusCode = 401;
      err.errorCode = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    const token = generateToken({ id: user._id, role: user.role });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.errorCode = 'USER_NOT_FOUND';
      throw err;
    }
    return user;
  }
}

export const authService = new AuthService();
export default authService;
