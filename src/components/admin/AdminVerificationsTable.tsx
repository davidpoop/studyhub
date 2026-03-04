'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, GraduationCap } from 'lucide-react';

interface Applicant {
  id: string;
  name: string | null;
  email: string | null;
  verificationDegree: string | null;
  verificationNote: string | null;
  createdAt: Date;
  memberUniversity: { id: string; name: string } | null;
}

export function AdminVerificationsTable({ applicants: initial }: { applicants: Applicant[] }) {
  const [applicants, setApplicants] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const handle = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setLoading(userId);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === 'APPROVE' ? 'Creator approved!' : 'Application rejected');
      setApplicants(a => a.filter(u => u.id !== userId));
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(null);
    }
  };

  if (applicants.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p>No pending creator applications</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applicants.map(u => (
        <div key={u.id} className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{u.name ?? 'No name'}</p>
              <p className="text-xs text-gray-400">{u.email}</p>
              {u.memberUniversity && (
                <p className="text-sm text-blue-700 mt-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {u.memberUniversity.name}
                </p>
              )}
              {u.verificationDegree && (
                <p className="text-sm text-gray-600 mt-0.5">{u.verificationDegree}</p>
              )}
              {u.verificationNote && (
                <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg p-3 italic">
                  &ldquo;{u.verificationNote}&rdquo;
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Applied {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handle(u.id, 'APPROVE')}
                disabled={loading === u.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handle(u.id, 'REJECT')}
                disabled={loading === u.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
