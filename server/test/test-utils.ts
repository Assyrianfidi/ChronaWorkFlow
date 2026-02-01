import jwt from "jsonwebtoken";

export async function createTestUser(user: any) {
  if (!user) return null;
  const prismaMod = await import("../prisma");
  const prisma = (prismaMod as any).prisma;
  if (!prisma?.user?.create) return null;
  return prisma.user.create({ data: user } as any);
}

export async function getAuthToken(_email: string, _password: string) {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET/SESSION_SECRET in test environment");
  }

  const payload = {
    id: "test-user-123",
    email: _email,
    role: "admin",
    currentCompanyId: "company1",
  };

  return jwt.sign(payload as any, secret, { algorithm: "HS256" });
}
