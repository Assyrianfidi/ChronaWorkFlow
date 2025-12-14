import { authConfig } from "./auth.js";
import { auth } from "./auth.js";
import { redirect } from "next/navigation";

export async function getServerSession() {
  return await auth();
}

export async function requireSession(redirectTo = "/auth/signin") {
  const session = await getServerSession();
  if (!session) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return session;
}

export function withAuth(
  handler: (
    session: Awaited<ReturnType<typeof getServerSession>>,
  ) => Promise<Response> | Response,
  options?: { requireAdmin?: boolean },
) {
  return async () => {
    try {
      const session = await getServerSession();
      if (!session) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (options?.requireAdmin && session.user.role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
      }

      return handler(session);
    } catch (error) {
      console.error("Auth error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}
