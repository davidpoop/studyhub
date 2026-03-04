import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FileText } from 'lucide-react';
import { CreateSubjectModal } from '@/components/modals/CreateSubjectModal';

async function getDegree(id: string) {
  return prisma.degree.findUnique({
    where: { id },
    include: {
      university: true,
      subjects: {
        include: { _count: { select: { topics: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });
}

export default async function DegreePage({ params }: { params: { id: string } }) {
  const degree = await getDegree(params.id);
  if (!degree) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Universities', href: '/universities' },
        { label: degree.university.name, href: `/universities/${degree.university.id}` },
        { label: degree.name },
      ]} />

      <div className="mt-6 mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{degree.name}</h1>
          <p className="text-gray-500 mt-1">{degree.university.name}</p>
          {degree.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">{degree.description}</p>
          )}
        </div>
        <CreateSubjectModal degreeId={degree.id} />
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Subjects</h2>

      {degree.subjects.length === 0 ? (
        <div className="text-center py-16 card">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No subjects yet for this degree</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {degree.subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subject.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {subject._count.topics} topic{subject._count.topics !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
