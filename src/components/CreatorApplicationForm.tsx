'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { X, Users, Search, CheckCircle, Clock, XCircle } from 'lucide-react';

type University = { id: string; name: string; country?: string | null; city?: string | null };

interface Props {
  verificationStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export function CreatorApplicationForm({ verificationStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [query, setQuery] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [degree, setDegree] = useState('');
  const [note, setNote] = useState('');

  // Fetch universities when modal opens
  useEffect(() => {
    if (!open) return;
    fetch('/api/universities')
      .then(r => r.json())
      .then(setUniversities)
      .catch(() => {});
  }, [open]);

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  const selectUniversity = (u: University) => {
    setUniversityId(u.id);
    setSelectedName(u.name);
    setQuery(u.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId) {
      toast.error('Please select your university');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universityId, verificationDegree: degree, verificationNote: note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }
      toast.success('Application submitted! An admin will review it shortly.');
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Show status banners instead of button if already applied
  if (verificationStatus === 'PENDING') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
        <Clock className="w-4 h-4 shrink-0" />
        <span>Creator application pending review by admin</span>
      </div>
    );
  }

  if (verificationStatus === 'VERIFIED') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span>Verified creator</span>
      </div>
    );
  }

  return (
    <>
      <div>
        {verificationStatus === 'REJECTED' && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Previous application was rejected. You can re-apply.</span>
          </div>
        )}
        <button onClick={() => setOpen(true)} className="btn-primary text-sm">
          Apply to become a Creator
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Apply to become a Creator</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <p className="text-sm text-gray-600">
                Tell us about yourself so we can verify you can upload quality study material for your university.
              </p>

              {/* University search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your university *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setUniversityId(''); setSelectedName(''); }}
                    placeholder="Search universities..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {query && !universityId && filtered.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                    {filtered.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUniversity(u)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="font-medium text-gray-900">{u.name}</p>
                        {(u.city || u.country) && (
                          <p className="text-xs text-gray-400">{[u.city, u.country].filter(Boolean).join(', ')}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {universityId && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {selectedName} selected
                  </p>
                )}
              </div>

              {/* Degree / year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree &amp; year *
                </label>
                <input
                  type="text"
                  required
                  value={degree}
                  onChange={e => setDegree(e.target.value)}
                  placeholder="e.g. 3rd year Electrical Engineering"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why should we verify you? *
                </label>
                <textarea
                  required
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. I've been studying at UPM for 3 years and have detailed notes from my professors..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !universityId} className="btn-primary flex-1">
                  {loading ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
