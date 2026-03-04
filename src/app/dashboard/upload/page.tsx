import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UploadForm } from '@/components/UploadForm';

async function getTopicsForSelect() {
  const topics = await prisma.topic.findMany({
    include: {
      subject: { include: { degree: { include: { university: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return topics.map(t => ({
    id: t.id,
    label: `${t.subject.degree.university.name} › ${t.subject.degree.name} › ${t.subject.name} › ${t.name}`,
  }));
}

export default async function UploadPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const topics = await getTopicsForSelect();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload content</h1>
      <p className="text-gray-600 mb-8">Share your knowledge with students at your university</p>
      <UploadForm topics={topics} />
    </div>
  );
}
