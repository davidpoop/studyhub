'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Upload, File, X, CheckCircle } from 'lucide-react';

type Topic = { id: string; label: string };

interface UploadFormProps {
  topics: Topic[];
}

type ContentType = 'VIDEO' | 'NOTES' | 'PDF' | 'EXERCISE_SOLUTIONS';

export function UploadForm({ topics }: UploadFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ContentType>('VIDEO');
  const [topicId, setTopicId] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov'],
      'application/pdf': ['.pdf'],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !topicId) {
      toast.error('Please select a file and topic');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Create content record
      const contentRes = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type, topicId, isPremium }),
      });
      if (!contentRes.ok) throw new Error('Failed to create content record');
      const content = await contentRes.json();

      // 2. Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          contentId: content.id,
        }),
      });
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { presignedUrl, key, isVideo } = await presignedRes.json();

      // 3. Upload file directly to R2
      await axios.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      // 4. Notify backend upload is complete
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: content.id, key, isVideo }),
      });
      if (!completeRes.ok) throw new Error('Failed to finalize upload');

      setDone(true);
      toast.success('Upload successful! Content is under review.');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="card p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upload complete!</h2>
        <p className="text-gray-600">Your content is being reviewed. Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="e.g. Integrales de línea - Ejercicios resueltos"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the content..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Content type *</label>
        <div className="grid grid-cols-2 gap-2">
          {(['VIDEO', 'PDF', 'NOTES', 'EXERCISE_SOLUTIONS'] as ContentType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t === 'EXERCISE_SOLUTIONS' ? 'Exercise Solutions' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
        <select
          value={topicId}
          onChange={e => setTopicId(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">Select a topic...</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {topics.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            No topics yet. <a href="/universities" className="underline">Create a university structure first.</a>
          </p>
        )}
      </div>

      {/* Premium toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPremium(!isPremium)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isPremium ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isPremium ? 'translate-x-5' : ''}`} />
        </button>
        <label className="text-sm font-medium text-gray-700">Premium content</label>
      </div>

      {/* File drop */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
              <File className="w-5 h-5 text-blue-500" />
              <span className="font-medium">{file.name}</span>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null); }}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                {isDragActive ? 'Drop here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV, PDF supported</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button type="submit" disabled={uploading} className="btn-primary w-full py-3">
        {uploading ? 'Uploading...' : 'Upload content'}
      </button>
    </form>
  );
}
