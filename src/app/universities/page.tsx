import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MapPin, GraduationCap, Plus } from 'lucide-react';
import { CreateUniversityModal } from '@/components/modals/CreateUniversityModal';

export const dynamic = 'force-dynamic';

async function getUniversities() {
  return prisma.university.findMany({
    include: { _count: { select: { degrees: true } } },
    orderBy: { name: 'asc' },
  });
}

export default async function UniversitiesPage() {
  const universities = await getUniversities();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Universities</h1>
          <p className="text-gray-600 mt-1">Find study material for your specific university courses</p>
        </div>
        <CreateUniversityModal />
      </div>

      {universities.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No universities yet</p>
          <p className="text-gray-400 mt-2">Be the first to add your university!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni) => (
            <Link
              key={uni.id}
              href={`/universities/${uni.id}`}
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                {uni.name}
              </h2>
              {(uni.city || uni.country) && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" />
                  {[uni.city, uni.country].filter(Boolean).join(', ')}
                </p>
              )}
              {uni.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{uni.description}</p>
              )}
              <p className="text-xs text-gray-400">
                {uni._count.degrees} degree{uni._count.degrees !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
