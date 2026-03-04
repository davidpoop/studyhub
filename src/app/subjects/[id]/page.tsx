import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Layers } from 'lucide-react';
import { CreateTopicModal } from '@/components/modals/CreateTopicModal';

async function getSubject(id: string) {
  return prisma.subject.findUnique({
    where: { id },
    include: {
      degree: { include: { university: true } },
      topics: {
        include: { _count: { select: { content: true } } },
        orderBy: { order: 'asc' },
      },
    },
  });
}

export default async function SubjectPage({ params }: { params: { id: string } }) {
  const subject = await getSubject(params.id);
  if (!subject) notFound();

  const { degree } = subject;
  const { university } = degree;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Universities', href: '/universities' },
        { label: university.name, href: `/universities/${university.id}` },
        { label: degree.name, href: `/degrees/${degree.id}` },
        { label: subject.name },
      ]} />

      <div className="mt-6 mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
          <p className="text-gray-500 mt-1">{university.name} · {degree.name}</p>
          {subject.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">{subject.description}</p>
          )}
        </div>
        <CreateTopicModal subjectId={subject.id} />
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Topics</h2>

      {subject.topics.length === 0 ? (
        <div className="text-center py-16 card">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No topics yet for this subject</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subject.topics.map((topic, idx) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {topic.name}
                </h3>
                {topic.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{topic.description}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {topic._count.content} item{topic._count.content !== 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
