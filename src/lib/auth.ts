import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    // Google OAuth (only if credentials provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Demo credentials login (always available)
    CredentialsProvider({
      name: 'Demo Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@studyhub.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Demo users for testing
        const demoUsers: Record<string, { name: string; role: Role }> = {
          'student@demo.com': { name: 'Demo Student', role: 'USER' },
          'creator@demo.com': { name: 'Demo Creator', role: 'CREATOR' },
          'admin@demo.com': { name: 'Demo Admin', role: 'ADMIN' },
        };

        const demoUser = demoUsers[credentials.email];
        if (demoUser && credentials.password === 'demo123') {
          // Upsert demo user in DB
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {},
            create: {
              email: credentials.email,
              name: demoUser.name,
              role: demoUser.role,
              emailVerified: new Date(),
            },
          });
          return user;
        }

        // Real user credentials lookup
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        // In production, use bcrypt. For MVP simplicity, plain compare.
        // Replace with: await bcrypt.compare(credentials.password, user.password)
        if (credentials.password !== user.password) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Sign-in: populate from user object
        token.role = user.role;
        token.id = user.id;
        token.verificationStatus = user.verificationStatus;
        token.universityId = user.universityId;
      } else if (token.id) {
        // Subsequent requests: refresh from DB so role/verification changes apply immediately
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, verificationStatus: true, universityId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.verificationStatus = dbUser.verificationStatus;
          token.universityId = dbUser.universityId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
        session.user.verificationStatus = token.verificationStatus;
        session.user.universityId = token.universityId;
      }
      return session;
    },
  },
};
