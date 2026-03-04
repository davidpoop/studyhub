import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Upload, Eye, Crown, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn, formatViews } from '@/lib/utils';
import { UpgradeButton } from '@/components/UpgradeButton';
import { StripeCheckoutButton } from '@/components/StripeCheckoutButton';

async function getDashboardData(userId: string, role: string) {
  if (role === 'CREATOR' || role === 'ADMIN') {
    const myContent = await prisma.content.findMany({
      where: { creatorId: userId },
      include: {
        topic: {
          include: { subject: { include: { degree: { include: { university: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return myContent;
  }
  return [];
}

async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });
}

const statusConfig = {
  PUBLISHED: { label: 'Published', icon: CheckCircle, color: 'text-green-600' },
  REVIEW: { label: 'Under review', icon: Clock, color: 'text-amber-600' },
  DRAFT: { label: 'Draft', icon: Clock, color: 'text-gray-500' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-600' },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [myContent, subscription] = await Promise.all([
    getDashboardData(session.user.id, session.user.role),
    getSubscription(session.user.id),
  ]);

  const isSubscribed = subscription?.status === 'ACTIVE';
  const totalViews = myContent.reduce((sum, c) => sum + c.views, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {session.user.name?.split(' ')[0]}!</p>
        </div>
        {(session.user.role === 'CREATOR' || session.user.role === 'ADMIN') && (
          <Link href="/dashboard/upload" className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload content
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total uploads</p>
            <Upload className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{myContent.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total views</p>
            <Eye className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatViews(totalViews)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Subscription</p>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {isSubscribed ? 'Premium' : 'Free'}
          </p>
          {isSubscribed && subscription?.currentPeriodEnd && (
            <p className="text-xs text-gray-400 mt-1">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Role upgrade */}
      {session.user.role === 'USER' && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Become a Creator
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload videos, notes, and study materials to help students at your university.
          </p>
          <UpgradeButton />
        </div>
      )}

      {/* Subscription CTA */}
      {!isSubscribed && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            Unlock Premium Content
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Get access to all premium videos, notes, and exercise solutions.
          </p>
          <StripeCheckoutButton label="Subscribe to Premium" className="btn-primary text-sm" />
        </div>
      )}

      {/* My content */}
      {(session.user.role === 'CREATOR' || session.user.role === 'ADMIN') && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My uploads</h2>
          {myContent.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <p>No uploads yet.</p>
              <Link href="/dashboard/upload" className="btn-primary mt-4 inline-block text-sm">
                Upload your first content
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myContent.map((item) => {
                const sc = statusConfig[item.status];
                const StatusIcon = sc.icon;
                return (
                  <div key={item.id} className="card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/content/${item.id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">
                        {item.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.topic.subject.degree.university.name} · {item.topic.subject.name} · {item.topic.name}
                      </p>
                    </div>
                    <div className={cn('flex items-center gap-1 text-xs font-medium', sc.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {sc.label}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViews(item.views)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
