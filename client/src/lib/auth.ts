import NextAuth, { type NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../types/next-auth';

const prisma = new PrismaClient();

// Auth configuration
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.sub || '';
        session.user.role = (token.role || 'USER') as UserRole;
        session.user.currentCompanyId = token.currentCompanyId || null;
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.role = user.role || 'USER';
        token.currentCompanyId = user.currentCompanyId || null;
        
        // Handle OAuth account linking
        if (account.provider === 'google' || account.provider === 'github') {
          // For OAuth users, ensure they have a role set
          if (!user.role) {
            // Default OAuth users to USER role
            try {
              const response = await fetch('/api/auth/update-oauth-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, role: 'USER' })
              });
              if (response.ok) {
                token.role = 'USER';
              }
            } catch (error) {
              console.error('Failed to update OAuth user role:', error);
            }
          }
        }
      }
      
      // Check if token is about to expire (within 5 minutes)
      if (token.exp) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = token.exp - now;
        
        // If token expires in less than 5 minutes, add refresh flag
        if (timeUntilExpiry < 300) {
          token.refreshNeeded = true;
        }
      }
      
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes - shorter for better security
    updateAge: 5 * 60, // Update every 5 minutes
  } as const,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

// Export the NextAuth handler
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// For backward compatibility
export default NextAuth(authConfig as any);
