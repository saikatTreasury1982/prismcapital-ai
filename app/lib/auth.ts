import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db, schema } from './db';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const { users, authPasswords } = schema;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'passkey',
      name: 'Passkey',
      credentials: {},
      async authorize(credentials) {
        const userId = (credentials as any)?.userId as string;
        
        if (!userId) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.user_id, userId))
          .limit(1);

        if (user && user.length > 0) {
          return {
            id: user[0].user_id,
            email: user[0].email,
            name: `${user[0].first_name} ${user[0].last_name}`,
          };
        }

        return null;
      },
    }),
    Credentials({
      id: 'password',
      name: 'Password',
      credentials: {
        identifier: { type: 'text' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const { identifier, password } = credentials as { identifier: string; password: string };

        if (!identifier || !password) return null;

        // Find user by user_id or email
        const user = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.user_id, identifier),
              eq(users.email, identifier)
            )
          )
          .limit(1);

        if (!user || user.length === 0) return null;

        const userId = user[0].user_id;

        // Get password hash
        const passwordRecord = await db
          .select()
          .from(authPasswords)
          .where(eq(authPasswords.user_id, userId))
          .limit(1);

        if (!passwordRecord || passwordRecord.length === 0) return null;

        // Verify password
        const isValid = await bcrypt.compare(password, passwordRecord[0].password_hash);

        if (!isValid) return null;

        return {
          id: user[0].user_id,
          email: user[0].email,
          name: `${user[0].first_name} ${user[0].last_name}`,
        };
      },
    }),
  ],
  pages: {
    signIn: '/',
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
  session: {
    strategy: 'jwt',
  },
});

// Helper function to get current user ID from session
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}