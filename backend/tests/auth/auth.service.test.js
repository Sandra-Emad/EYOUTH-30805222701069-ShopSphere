import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import authService from "../../src/services/auth.service.js";

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
} = authService;

describe("Auth Service", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe("registerUser", () => {
    test("should register a new user successfully", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 1,
            name: "Sandra",
            email: "sandra@example.com",
            role: "CUSTOMER",
            createdAt: new Date(),
          }),
        },
      };

      const result = await authService.registerUser(
        {
          name: " Sandra ",
          email: " SANDRA@EXAMPLE.COM ",
          password: "Password123",
        },
        database
      );

      expect(database.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "sandra@example.com",
        },
      });

      expect(database.user.create).toHaveBeenCalled();

      expect(result.email).toBe("sandra@example.com");
      expect(result.name).toBe("Sandra");
    });

    test("should reject duplicate email", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: "sandra@example.com",
          }),
          create: jest.fn(),
        },
      };

      await expect(
        authService.registerUser(
          {
            name: "Sandra",
            email: "sandra@example.com",
            password: "Password123",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Email is already registered",
        statusCode: 409,
      });

      expect(database.user.create).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    const user = {
      id: 1,
      name: "Sandra",
      email: "sandra@example.com",
      password: "hashed-password",
      role: "CUSTOMER",
      createdAt: new Date(),
    };

    beforeEach(() => {
      process.env.JWT_SECRET = "test-secret";
    });

    test("should reject login when user does not exist", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      await expect(
        authService.loginUser(
          {
            email: "missing@example.com",
            password: "Password123",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        statusCode: 401,
      });
    });

    test("should reject login when password is incorrect", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
        },
      };

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(false);

      await expect(
        authService.loginUser(
          {
            email: "sandra@example.com",
            password: "WrongPassword",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        statusCode: 401,
      });

      bcrypt.compare.mockRestore();
    });

    test("should login successfully with correct credentials", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
        },
      };

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest.spyOn(jwt, "sign").mockReturnValue("test-token");

      const result = await authService.loginUser(
        {
          email: " SANDRA@EXAMPLE.COM ",
          password: "Password123",
        },
        database
      );

      expect(result.token).toBe("test-token");
      expect(result.user).toEqual({
        id: 1,
        name: "Sandra",
        email: "sandra@example.com",
        role: "CUSTOMER",
        createdAt: user.createdAt,
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 1,
          email: "sandra@example.com",
          role: "CUSTOMER",
        },
        "test-secret",
        {
          expiresIn: "7d",
        }
      );

      bcrypt.compare.mockRestore();
      jwt.sign.mockRestore();
    });

    test("should reject login when JWT secret is missing", async () => {
      process.env.JWT_SECRET = "";

      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
        },
      };

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      await expect(
        authService.loginUser(
          {
            email: "sandra@example.com",
            password: "Password123",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "JWT secret is not configured",
        statusCode: 500,
      });

      bcrypt.compare.mockRestore();
    });
  });

  describe("getCurrentUser", () => {
    test("should return current user successfully", async () => {
      const user = {
        id: 1,
        name: "Sandra",
        email: "sandra@example.com",
        role: "CUSTOMER",
        createdAt: new Date(),
      };

      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
        },
      };

      const result = await authService.getCurrentUser(
        1,
        database
      );

      expect(result).toEqual(user);

      expect(database.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    test("should reject when current user does not exist", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      await expect(
        authService.getCurrentUser(999, database)
      ).rejects.toMatchObject({
        message: "User not found",
        statusCode: 404,
      });
    });
  });

  describe("updateCurrentUser", () => {
    test("should reject when user does not exist", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      };

      await expect(
        authService.updateCurrentUser(
          999,
          {
            name: "Sandra",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "User not found",
        statusCode: 404,
      });

      expect(database.user.update).not.toHaveBeenCalled();
    });

    test("should update name successfully", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            name: "Old Name",
            email: "sandra@example.com",
          }),
          update: jest.fn().mockResolvedValue({
            id: 1,
            name: "New Name",
            email: "sandra@example.com",
            role: "CUSTOMER",
            createdAt: new Date(),
          }),
        },
      };

      const result =
        await authService.updateCurrentUser(
          1,
          {
            name: " New Name ",
          },
          database
        );

      expect(database.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
          data: {
            name: "New Name",
          },
        })
      );

      expect(result.name).toBe("New Name");
    });

    test("should reject duplicate email", async () => {
      const database = {
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              name: "Sandra",
              email: "sandra@example.com",
            })
            .mockResolvedValueOnce({
              id: 2,
              name: "Another User",
              email: "other@example.com",
            }),
          update: jest.fn(),
        },
      };

      await expect(
        authService.updateCurrentUser(
          1,
          {
            email: "other@example.com",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Email is already registered",
        statusCode: 409,
      });

      expect(database.user.update).not.toHaveBeenCalled();
    });

    test("should update email successfully", async () => {
      const database = {
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              name: "Sandra",
              email: "old@example.com",
            })
            .mockResolvedValueOnce(null),
          update: jest.fn().mockResolvedValue({
            id: 1,
            name: "Sandra",
            email: "new@example.com",
            role: "CUSTOMER",
            createdAt: new Date(),
          }),
        },
      };

      const result =
        await authService.updateCurrentUser(
          1,
          {
            email: " NEW@EXAMPLE.COM ",
          },
          database
        );

      expect(database.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            email: "new@example.com",
          },
        })
      );

      expect(result.email).toBe("new@example.com");
    });

    test("should update password successfully", async () => {
      const database = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            name: "Sandra",
            email: "sandra@example.com",
          }),
          update: jest.fn().mockResolvedValue({
            id: 1,
            name: "Sandra",
            email: "sandra@example.com",
            role: "CUSTOMER",
            createdAt: new Date(),
          }),
        },
      };

      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("new-hashed-password");

      await authService.updateCurrentUser(
        1,
        {
          password: "NewPassword123",
        },
        database
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "NewPassword123",
        12
      );

      expect(database.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            password: "new-hashed-password",
          },
        })
      );

      bcrypt.hash.mockRestore();
    });

    test("should update multiple fields successfully", async () => {
      const database = {
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              name: "Sandra",
              email: "old@example.com",
            })
            .mockResolvedValueOnce(null),
          update: jest.fn().mockResolvedValue({
            id: 1,
            name: "Updated Sandra",
            email: "updated@example.com",
            role: "CUSTOMER",
            createdAt: new Date(),
          }),
        },
      };

      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashed-password");

      await authService.updateCurrentUser(
        1,
        {
          name: " Updated Sandra ",
          email: " UPDATED@EXAMPLE.COM ",
          password: "NewPassword123",
        },
        database
      );

      expect(database.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: "Updated Sandra",
            email: "updated@example.com",
            password: "hashed-password",
          },
        })
      );

      bcrypt.hash.mockRestore();
    });
  });
});