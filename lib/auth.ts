import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ethers } from 'ethers';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'wallet',
      name: 'Wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
          return null;
        }

        try {
          // Verify the wallet address format
          if (!ethers.isAddress(credentials.walletAddress)) {
            return null;
          }

          // Verify the signature
          const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);
          
          if (recoveredAddress.toLowerCase() !== credentials.walletAddress.toLowerCase()) {
            return null;
          }

          // Check if user exists, if not create one
          let user = await prisma.user.findUnique({
            where: { walletAddress: credentials.walletAddress.toLowerCase() },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                walletAddress: credentials.walletAddress.toLowerCase(),
                name: `User ${credentials.walletAddress.slice(0, 6)}...${credentials.walletAddress.slice(-4)}`,
              },
            });
          }

          return {
            id: user.id,
            walletAddress: user.walletAddress,
            name: user.name,
            email: null,
          };
        } catch (error) {
          console.error('Wallet authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.walletAddress) {
        session.user.walletAddress = token.walletAddress as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup',
  },
}; 