import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { isDatabaseConnected } from '../config/database.js';
import env from '../config/env.js';

function requireProductionDatabase() {
  if (env.isProduction && !isDatabaseConnected()) {
    const error = new Error('Database is unavailable. Authentication cannot be served until MongoDB reconnects.');
    error.statusCode = 503;
    error.errorCode = 'DATABASE_UNAVAILABLE';
    throw error;
  }
}

// Deliberately empty: local memory can hold users created during development,
// but demo credentials must never be accepted as operational accounts.
const IN_MEMORY_USERS = [];

class AuthService {
  async registerUser({ name, email, password, phone, organization }) {
    requireProductionDatabase();
    // Public registration must never grant an elevated role supplied by the client.
    const registrationRole = 'viewer';
    if (!isDatabaseConnected()) {
      const existing = IN_MEMORY_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        const err = new Error('An account with this email address already exists.');
        err.statusCode = 409;
        err.errorCode = 'USER_EXISTS';
        throw err;
      }
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email: email.toLowerCase().trim(),
        password,
        role: registrationRole,
        phone: phone || '',
        organization: organization || 'Disaster Management Authority',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      IN_MEMORY_USERS.push(newUser);
      const token = generateToken({ id: newUser.id, role: newUser.role });
      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          organization: newUser.organization,
          createdAt: newUser.createdAt,
        },
        token,
      };
    }

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
      role: registrationRole,
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
    requireProductionDatabase();
    if (!email || !password) {
      const err = new Error('Please provide both email and password.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    const normalizedIdentifier = (email || '').toLowerCase().trim();

    if (!isDatabaseConnected()) {
      const memUser = IN_MEMORY_USERS.find(
        (u) =>
          u.email.toLowerCase() === normalizedIdentifier ||
          (u.username && u.username.toLowerCase() === normalizedIdentifier)
      );
      if (!memUser || memUser.password !== password) {
        const err = new Error('Invalid email or password.');
        err.statusCode = 401;
        err.errorCode = 'INVALID_CREDENTIALS';
        throw err;
      }

      if (!memUser.isActive) {
        const err = new Error('Your account is deactivated. Contact an administrator.');
        err.statusCode = 401;
        err.errorCode = 'ACCOUNT_DEACTIVATED';
        throw err;
      }

      const token = generateToken({ id: memUser.id, role: memUser.role });
      return {
        user: {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          phone: memUser.phone,
          organization: memUser.organization,
          createdAt: memUser.createdAt,
        },
        token,
      };
    }

    let user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    }).select('+password');

    if (!user && !normalizedIdentifier.includes('@')) {
      user = await User.findOne({ email: `${normalizedIdentifier}@unified.gov` }).select('+password');
    }

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
    requireProductionDatabase();
    if (!isDatabaseConnected()) {
      const memUser = IN_MEMORY_USERS.find(
        (u) =>
          u.id === userId ||
          (u.username && u.username.toLowerCase() === (userId || '').toLowerCase()) ||
          u.email.toLowerCase() === (userId || '').toLowerCase()
      );
      if (!memUser) {
        const err = new Error('User not found.');
        err.statusCode = 404;
        err.errorCode = 'USER_NOT_FOUND';
        throw err;
      }
      const { password: _, ...safeUser } = memUser;
      return safeUser;
    }

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
