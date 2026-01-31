// tests/unit/controllers/auth.controller.test.js
const { register, login, refreshToken } = require('../../../src/controllers/auth.controller');
const { hash, compare } = require('../../../src/utils/password');
const { sign, verify } = require('../../../src/utils/jwt');

jest.mock('../../../src/utils/password');
jest.mock('../../../src/utils/jwt');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
      };

      hash.mockResolvedValue('hashed_password');

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 400 for invalid email', async () => {
      mockReq.body = {
        name: 'John',
        email: 'invalid-email',
        password: 'SecurePassword123!',
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for short password', async () => {
      mockReq.body = {
        name: 'John',
        email: 'john@example.com',
        password: 'short',
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockReq.body = {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      };

      compare.mockResolvedValue(true);
      sign.mockReturnValue('jwt_token');

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', async () => {
      mockReq.body = {
        email: 'admin@example.com',
        password: 'WrongPassword',
      };

      compare.mockResolvedValue(false);

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockReq.body = {
        refreshToken: 'valid_refresh_token',
      };

      verify.mockReturnValue({ id: '123', email: 'test@example.com' });
      sign.mockReturnValue('new_access_token');

      await refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 for invalid refresh token', async () => {
      mockReq.body = {
        refreshToken: 'invalid_token',
      };

      verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
