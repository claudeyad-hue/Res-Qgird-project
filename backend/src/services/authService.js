import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { isDatabaseConnected } from '../config/database.js';

const IN_MEMORY_USERS = [
  {
    id: 'user-000',
    name: 'Command Director Arjun Yadav',
    email: 'arjun@unified.gov',
    username: 'arjun',
    password: 'password123',
    role: 'admin',
    phone: '+91 98765 43210',
    organization: 'Ghaziabad Disaster Management Directorate',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-001',
    name: 'Command Admin Alex',
    email: 'admin@unified.gov',
    username: 'admin',
    password: 'password123',
    role: 'admin',
    phone: '+1 555-0101',
    organization: 'City Disaster Management Authority',
    isActive: true,
  },
  {
    id: 'user-002',
    name: 'Operator Olivia',
    email: 'operator@unified.gov',
    username: 'operator',
    password: 'password123',
    role: 'operator',
    phone: '+1 555-0102',
    organization: 'Emergency Operations Center',
    isActive: true,
  },
  {
    id: 'user-003',
    name: 'Responder Ryan',
    email: 'responder@unified.gov',
    username: 'responder',
    password: 'password123',
    role: 'responder',
    phone: '+1 555-0103',
    organization: 'Disaster Rapid Response Team Alpha',
    isActive: true,
  },
  {
    id: 'user-004',
    name: 'Dr. Maya Medical',
    email: 'medical@unified.gov',
    username: 'medical',
    password: 'password123',
    role: 'medical',
    phone: '+1 555-0104',
    organization: 'City Healthcare Network',
    isActive: true,
  },
  {
    id: 'user-005',
    name: 'Public Viewer Victor',
    email: 'viewer@unified.gov',
    username: 'viewer',
    password: 'password123',
    role: 'viewer',
    phone: '+1 555-0105',
    organization: 'Public Information Bureau',
    isActive: true,
  },
  {
    id: 'user-006',
    name: 'Alex Dawson',
    email: 'alex.dawson@ghaziabad.gov.in',
    username: 'alex',
    password: 'password123',
    role: 'operator',
    phone: '+91 120 282 0100',
    organization: 'Ghaziabad District Disaster Management Authority (DDMA)',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

class AuthService {
  async registerUser({ name, email, password, role, phone, organization }) {
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
        role: role || 'viewer',
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
