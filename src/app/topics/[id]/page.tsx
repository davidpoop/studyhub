import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ContentCard } from '@/components/ContentCard';
import { TopicUploadModal } from '@/components/modals/TopicUploadModal';
import { Play, FileText, BookOpen, PenTool } from 'lucide-react';
import Link from 'next/link';

async function getTopic(id: string) {
  return prisma.topic.findUnique({
    where: { id },
    include: {
      subject: { include: { degree: { include: { university: true } } } },
      content: {
        where: { status: 'PUBLISHED' },
        include: { creator: { select: { id: true, name: true, image: true } } },
        orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
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

export default async function TopicPage({ params }: { params: { id: string } }) {
  const [topic, session] = await Promise.all([
    getTopic(params.id),
    getServerSession(authOptions),
  ]);

  if (!topic) notFound();

  const isSubscribed = session
    ? await getUserSubscription(session.user.id)
    : false;

  const { subject } = topic;
  const { degree } = subject;
  const { university } = degree;

  const videos = topic.content.filter(c => c.type === 'VIDEO');
  const notes = topic.content.filter(c => c.type === 'NOTES' || c.type === 'PDF');
  const exercises = topic.content.filter(c => c.type === 'EXERCISE_SOLUTIONS');

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Universities', href: '/universities' },
        { label: university.name, href: `/universities/${university.id}` },
        { label: degree.name, href: `/degrees/${degree.id}` },
        { label: subject.name, href: `/subjects/${subject.id}` },
        { label: topic.name },
      ]} />

      <div className="mt-6 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
          <p className="text-gray-500 mt-1">{university.name} · {degree.name} · {subject.name}</p>
          {topic.description && (
            <p className="text-gray-600 mt-3 max-w-2xl">{topic.description}</p>
          )}
        </div>
        {session && (session.user.role === 'CREATOR' || session.user.role === 'ADMIN') && (
          <div className="shrink-0">
            <TopicUploadModal topicId={topic.id} topicName={topic.name} />
          </div>
        )}
      </div>

      {topic.content.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-gray-500 text-lg">No content yet for this topic</p>
          {session && (session.user.role === 'CREATOR' || session.user.role === 'ADMIN') && (
            <div className="mt-4 flex justify-center">
              <TopicUploadModal topicId={topic.id} topicName={topic.name} />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {videos.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                <Play className="w-4 h-4 text-red-500" /> Videos ({videos.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {videos.map(c => (
                  <ContentCard key={c.id} {...c} isSubscribed={isSubscribed} />
                ))}
              </div>
            </section>
          )}

          {notes.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                <BookOpen className="w-4 h-4 text-blue-500" /> Notes & PDFs ({notes.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {notes.map(c => (
                  <ContentCard key={c.id} {...c} isSubscribed={isSubscribed} />
                ))}
              </div>
            </section>
          )}

          {exercises.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                <PenTool className="w-4 h-4 text-green-500" /> Exercise Solutions ({exercises.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {exercises.map(c => (
                  <ContentCard key={c.id} {...c} isSubscribed={isSubscribed} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
