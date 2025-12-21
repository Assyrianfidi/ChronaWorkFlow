import { prisma } from "../prisma";

export async function createTestUser(user: any) {
  if (!user) return null;
  if (!prisma.user?.create) return null;
  return prisma.user.create({ data: user } as any);
}

export async function getAuthToken(_email: string, _password: string) {
  return "test-token";
}
