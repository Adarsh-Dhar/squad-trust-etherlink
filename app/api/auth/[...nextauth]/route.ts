import NextAuth from 'next-auth';
// TODO: Configure NextAuth providers

const handler = NextAuth({
  providers: [], // Add providers here
});

export { handler as GET, handler as POST }; 