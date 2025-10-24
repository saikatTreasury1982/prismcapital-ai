import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db, schema } from './db';
import { eq } from 'drizzle-orm';

const { users, authOtpCodes } = schema;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'passkey',
      name: 'Passkey',
      credentials: {},
      async authorize(credentials) {
        // Passkey verification happens client-side
        // This just confirms the user exists
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
      id: 'otp',
      name: 'OTP',
      credentials: {
        phone: { type: 'text' },
        code: { type: 'text' },
      },
      async authorize(credentials) {
        const { phone, code } = credentials as { phone: string; code: string };

        // Verify OTP
        const otpRecord = await db
          .select()
          .from(authOtpCodes)
          .where(eq(authOtpCodes.phone_number, phone))
          .limit(1);

        if (!otpRecord || otpRecord.length === 0) return null;

        const otp = otpRecord[0];

        if (otp.code !== code || otp.is_used === 1) return null;
        if (new Date(otp.expires_at) < new Date()) return null;

        // Mark OTP as used
        await db
          .update(authOtpCodes)
          .set({ is_used: 1 })
          .where(eq(authOtpCodes.otp_id, otp.otp_id));

        // Get user
        const user = await db
          .select()
          .from(users)
          .where(eq(users.user_id, otp.user_id))
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

export const CURRENT_USER_ID = 'beb2f83d-998e-4bb2-9510-ae9916e339f3';