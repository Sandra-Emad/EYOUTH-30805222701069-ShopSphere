import testPrisma from "../config/test-prisma.js";

export const useTestDatabase = (req, res, next) => {
  req.database = testPrisma;
  next();
};

export default useTestDatabase;