import Link from 'next/link';
import { BookOpen, Play, Users, Award, ArrowRight, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [universities, content, users] = await Promise.all([
    prisma.university.count(),
    prisma.content.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count(),
  ]);
  return { universities, content, users };
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Study material tailored to<br />
            <span className="text-blue-200">your university courses</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Find videos, notes, and exercise solutions specific to your university, degree, and subject.
            Not generic content — your exact curriculum.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/universities" className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Find your university
            </Link>
            <Link href="/login" className="bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-400 transition-colors flex items-center justify-center gap-2 border border-blue-400">
              Start uploading
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">{stats.universities}+</p>
            <p className="text-gray-600 mt-1">Universities</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{stats.content}+</p>
            <p className="text-gray-600 mt-1">Study materials</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{stats.users}+</p>
            <p className="text-gray-600 mt-1">Students & Creators</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How StudyHub works</h2>
          <p className="text-center text-gray-600 mb-12">Find your exact university subject in seconds</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: BookOpen, title: 'Select university', desc: 'Choose your university from our list or create it.' },
              { step: '2', icon: Award, title: 'Pick your degree', desc: 'Select your engineering, science, or arts degree.' },
              { step: '3', icon: Search, title: 'Find subject', desc: 'Navigate to your specific subject and topic.' },
              { step: '4', icon: Play, title: 'Start learning', desc: 'Watch videos, read notes, solve exercises.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-blue-500 mb-1">STEP {step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example curriculum */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Example: UPM Electrical Engineering</h2>
          <div className="card overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <p className="text-sm font-medium opacity-80">UPM → Electrical Engineering</p>
              <p className="text-lg font-semibold">Ampliación de Matemáticas</p>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { topic: 'Tema 1: Campos vectoriales y escalares', items: ['Theory video', 'Exercise solutions'] },
                { topic: 'Tema 2: Integrales de línea', items: ['Theory video', 'PDF notes', 'Exercise solutions', 'Exam prep'] },
                { topic: 'Tema 3: Teorema de Green', items: ['Theory video', 'Summary notes'] },
              ].map(({ topic, items }) => (
                <div key={topic} className="px-6 py-4">
                  <p className="font-medium text-gray-900 mb-2">{topic}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                      <span key={item} className="badge bg-blue-50 text-blue-700">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/universities" className="btn-primary">
              Browse all universities
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Share your knowledge</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
          Are you a student or professor with great study material? Upload it and help thousands of students in your university.
        </p>
        <Link href="/login" className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
          <Users className="w-5 h-5" />
          Become a creator
        </Link>
      </section>
    </div>
  );
}
