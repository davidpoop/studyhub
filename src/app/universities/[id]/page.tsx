import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BookOpen, Plus } from 'lucide-react';
import { CreateDegreeModal } from '@/components/modals/CreateDegreeModal';

async function getUniversity(id: string) {
  return prisma.university.findUnique({
    where: { id },
    include: {
      degrees: {
        include: { _count: { select: { subjects: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });
}

export default async function UniversityPage({ params }: { params: { id: string } }) {
  const university = await getUniversity(params.id);
  if (!university) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Universities', href: '/universities' },
        { label: university.name },
      ]} />

      <div className="mt-6 mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{university.name}</h1>
          {university.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">{university.description}</p>
          )}
        </div>
        <CreateDegreeModal universityId={university.id} />
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Degrees & Programs</h2>

      {university.degrees.length === 0 ? (
        <div className="text-center py-16 card">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No degrees yet for this university</p>
          <p className="text-gray-400 text-sm mt-1">Add the first degree!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {university.degrees.map((degree) => (
            <Link
              key={degree.id}
              href={`/degrees/${degree.id}`}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {degree.name}
              </h3>
              {degree.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{degree.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {degree._count.subjects} subject{degree._count.subjects !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
