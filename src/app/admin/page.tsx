import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminContentTable } from '@/components/admin/AdminContentTable';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminVerificationsTable } from '@/components/admin/AdminVerificationsTable';
import { Shield } from 'lucide-react';

async function getReviewContent() {
  return prisma.content.findMany({
    where: { status: 'REVIEW' },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      topic: {
        include: {
          subject: { include: { degree: { include: { university: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { content: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

async function getPendingVerifications() {
  return prisma.user.findMany({
    where: { verificationStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      email: true,
      verificationDegree: true,
      verificationNote: true,
      createdAt: true,
      memberUniversity: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const [reviewContent, users, pendingVerifications] = await Promise.all([
    getReviewContent(),
    getUsers(),
    getPendingVerifications(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Moderate content, verify creators, and manage users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Pending content</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{reviewContent.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Creator applications</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{pendingVerifications.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total users</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Creators</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {users.filter(u => u.role === 'CREATOR').length}
          </p>
        </div>
      </div>

      {/* Creator verifications */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Creator applications
          {pendingVerifications.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-purple-600 text-white rounded-full">
              {pendingVerifications.length}
            </span>
          )}
        </h2>
        <AdminVerificationsTable applicants={pendingVerifications} />
      </section>

      {/* Pending content */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Content pending review</h2>
        <AdminContentTable content={reviewContent} />
      </section>

      {/* Users */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Users</h2>
        <AdminUsersTable users={users} />
      </section>
    </div>
  );
}
