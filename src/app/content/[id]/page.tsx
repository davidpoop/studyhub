import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Breadcrumb } from '@/components/Breadcrumb';
import { VideoPlayer } from '@/components/VideoPlayer';
import { PdfViewer } from '@/components/PdfViewer';
import { StripeCheckoutButton } from '@/components/StripeCheckoutButton';
import { Eye, Calendar, Lock, Crown } from 'lucide-react';
import { formatViews } from '@/lib/utils';
import Link from 'next/link';

async function getContent(id: string) {
  return prisma.content.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true, bio: true } },
      topic: {
        include: {
          subject: { include: { degree: { include: { university: true } } } },
        },
      },
    },
  });
}

async function getUserSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true },
  });
  return sub?.status === 'ACTIVE';
}

export default async function ContentPage({ params }: { params: { id: string } }) {
  const [content, session] = await Promise.all([
    getContent(params.id),
    getServerSession(authOptions),
  ]);

  if (!content) notFound();
  if (content.status !== 'PUBLISHED' && session?.user.role !== 'ADMIN' && session?.user.id !== content.creatorId) {
    notFound();
  }

  const isSubscribed = session ? await getUserSubscription(session.user.id) : false;
  const isLocked = content.isPremium && !isSubscribed && session?.user.role !== 'ADMIN';

  const { topic } = content;
  const { subject } = topic;
  const { degree } = subject;
  const { university } = degree;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb crumbs={[
        { label: 'Universities', href: '/universities' },
        { label: university.name, href: `/universities/${university.id}` },
        { label: degree.name, href: `/degrees/${degree.id}` },
        { label: subject.name, href: `/subjects/${subject.id}` },
        { label: topic.name, href: `/topics/${topic.id}` },
        { label: content.title },
      ]} />

      <div className="mt-6 grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {isLocked ? (
            <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white">
              <Lock className="w-12 h-12 mb-3 opacity-60" />
              <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
              <p className="text-gray-400 mb-6 text-sm">Subscribe to unlock all premium study materials</p>
              <StripeCheckoutButton label="Unlock with Premium" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2" />
            </div>
          ) : (
            <>
              {content.type === 'VIDEO' && content.muxPlaybackId && (
                <VideoPlayer playbackId={content.muxPlaybackId} title={content.title} />
              )}
              {(content.type === 'PDF' || content.type === 'NOTES') && content.fileUrl && (
                <PdfViewer url={content.fileUrl} />
              )}
              {content.type === 'EXERCISE_SOLUTIONS' && content.fileUrl && (
                <PdfViewer url={content.fileUrl} />
              )}
            </>
          )}

          {/* Title & meta */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
              {content.isPremium && (
                <span className="badge bg-amber-100 text-amber-700 flex-shrink-0 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatViews(content.views)} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(content.createdAt).toLocaleDateString()}
              </span>
            </div>

            {content.description && (
              <p className="mt-4 text-gray-600 leading-relaxed">{content.description}</p>
            )}
          </div>

          {/* Creator */}
          <div className="mt-6 card p-4 flex items-center gap-3">
            {content.creator.image ? (
              <img src={content.creator.image} className="w-12 h-12 rounded-full" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {content.creator.name?.[0] ?? 'U'}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{content.creator.name ?? 'Anonymous'}</p>
              {content.creator.bio && <p className="text-sm text-gray-500">{content.creator.bio}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Course info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">University</p>
                <Link href={`/universities/${university.id}`} className="text-blue-600 hover:underline font-medium">
                  {university.name}
                </Link>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Degree</p>
                <Link href={`/degrees/${degree.id}`} className="text-blue-600 hover:underline font-medium">
                  {degree.name}
                </Link>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Subject</p>
                <Link href={`/subjects/${subject.id}`} className="text-blue-600 hover:underline font-medium">
                  {subject.name}
                </Link>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Topic</p>
                <Link href={`/topics/${topic.id}`} className="text-blue-600 hover:underline font-medium">
                  {topic.name}
                </Link>
              </div>
            </div>
          </div>

          {!isSubscribed && (
            <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <Crown className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">StudyHub Premium</h3>
              <p className="text-sm text-gray-600 mb-4">Unlock all premium content and study smarter</p>
              <StripeCheckoutButton label="Subscribe now" className="btn-primary w-full text-sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
