'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface ContentRow {
  id: string;
  title: string;
  type: string;
  creator: { name: string | null; email: string | null };
  topic: {
    name: string;
    subject: { name: string; degree: { name: string; university: { name: string } } };
  };
}

export function AdminContentTable({ content: initial }: { content: ContentRow[] }) {
  const [content, setContent] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (contentId: string, status: 'PUBLISHED' | 'REJECTED') => {
    setLoading(contentId);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Content ${status === 'PUBLISHED' ? 'approved' : 'rejected'}`);
      setContent(c => c.filter(item => item.id !== contentId));
    } catch {
      toast.error('Failed to update status');
    } finally {
      setLoading(null);
    }
  };

  if (content.length === 0) {
    return <div className="card p-8 text-center text-gray-500">No content pending review</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Creator</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {content.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{item.title}</span>
                    <Link href={`/content/${item.id}`} target="_blank" className="text-gray-400 hover:text-blue-500">
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  <span>{item.topic.subject.degree.university.name}</span>
                  <span className="mx-1">›</span>
                  <span>{item.topic.subject.name}</span>
                  <span className="mx-1">›</span>
                  <span>{item.topic.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.creator.name ?? item.creator.email}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-gray-100 text-gray-700">{item.type}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(item.id, 'PUBLISHED')}
                      disabled={loading === item.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'REJECTED')}
                      disabled={loading === item.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
