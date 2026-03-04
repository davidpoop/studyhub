'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Upload, File, X, CheckCircle, Play, FileText, BookOpen } from 'lucide-react';

type UploadMode = 'VIDEO' | 'NOTES' | 'EXERCISE_SOLUTIONS';

interface TopicUploadModalProps {
  topicId: string;
  topicName: string;
}

const MODES: { value: UploadMode; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'VIDEO', label: 'Exercise video', icon: Play, color: 'red' },
  { value: 'NOTES', label: 'Notes PDF', icon: BookOpen, color: 'blue' },
  { value: 'EXERCISE_SOLUTIONS', label: 'Solutions PDF', icon: FileText, color: 'green' },
];

const activeColors: Record<string, string> = {
  red: 'bg-red-50 border-red-300 text-red-700',
  blue: 'bg-blue-50 border-blue-300 text-blue-700',
  green: 'bg-green-50 border-green-300 text-green-700',
};

export function TopicUploadModal({ topicId, topicName }: TopicUploadModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<UploadMode>('VIDEO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const isVideo = mode === 'VIDEO';

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: isVideo
      ? { 'video/*': ['.mp4', '.webm', '.mov'] }
      : { 'application/pdf': ['.pdf'] },
  });

  const reset = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setProgress(0);
    setDone(false);
    setMode('VIDEO');
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleModeChange = (m: UploadMode) => {
    setMode(m);
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!title.trim()) { toast.error('Please enter a title'); return; }

    setUploading(true);
    setProgress(0);

    try {
      const contentRes = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type: mode,
          topicId,
          isPremium: false,
        }),
      });
      if (!contentRes.ok) {
        const err = await contentRes.json();
        throw new Error(err.error || 'Failed to create content record');
      }
      const content = await contentRes.json();

      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, contentId: content.id }),
      });
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { presignedUrl, key, isVideo: isVid } = await presignedRes.json();

      await axios.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: content.id, key, isVideo: isVid }),
      });
      if (!completeRes.ok) throw new Error('Failed to finalize upload');

      setDone(true);
      toast.success('Upload successful! Content is under review.');
      setTimeout(() => { router.refresh(); handleClose(); }, 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const currentMode = MODES.find(m => m.value === mode)!;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
        <Upload className="w-4 h-4" /> Upload content
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900">Upload content</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{topicName}</p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {done ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Upload complete!</p>
                  <p className="text-sm text-gray-500 mt-1">Your content is under review.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Mode tabs */}
                  <div className="flex gap-2">
                    {MODES.map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleModeChange(value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          mode === value
                            ? activeColors[color]
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={
                        isVideo ? 'e.g. Exercise 3 – step-by-step walkthrough'
                        : mode === 'NOTES' ? 'e.g. Lecture notes – Topic 2'
                        : 'e.g. Problem set 2 – Solved'
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>

                  {/* File drop */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isVideo ? 'Video file *' : 'PDF file *'}
                    </label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {file ? (
                        <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
                          <File className="w-5 h-5 text-blue-500 shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={ev => { ev.stopPropagation(); setFile(null); }}
                            className="text-gray-400 hover:text-red-500 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <currentMode.icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            {isDragActive ? 'Drop here' : 'Drag & drop or click to select'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {isVideo ? 'MP4, WebM, MOV' : 'PDF only'}
                          </p>
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

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={handleClose} disabled={uploading} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button type="submit" disabled={uploading || !file} className="btn-primary flex-1">
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
