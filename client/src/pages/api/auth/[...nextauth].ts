export default function handler(req: any, res: any) {
  res.status(501).json({
    error:
      "NextAuth is not configured in this project build. Install next-auth and wire up /src/lib/auth to enable.",
  });
}
