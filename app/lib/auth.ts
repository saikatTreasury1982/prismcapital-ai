
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db, schema } from './db';
import { eq } from 'drizzle-orm';

const { users, authSessions } = schema;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'passkey',
      name: 'Passkey',
      credentials: {
        credential: { label: 'Credential', type: 'text' },
      },
      async authorize(credentials) {
        // Passkey verification logic (we'll add this next)
        return null;
      },
    }),
    Credentials({
      id: 'otp',
      name: 'OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        // OTP verification logic (we'll add this next)
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});

// Hardcoded user ID for personal use
export const CURRENT_USER_ID = 'beb2f83d-998e-4bb2-9510-ae9916e339f3'; // Replace with your actual user_id from the users table