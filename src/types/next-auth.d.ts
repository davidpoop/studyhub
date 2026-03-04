import { Role, VerificationStatus } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      verificationStatus: VerificationStatus;
      universityId?: string | null;
    };
  }

  interface User {
    role: Role;
    verificationStatus: VerificationStatus;
    universityId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
    id: string;
    verificationStatus: VerificationStatus;
    universityId?: string | null;
  }
}
