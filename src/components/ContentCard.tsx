import Link from 'next/link';
import { Play, FileText, BookOpen, PenTool, Clock, Eye, Lock } from 'lucide-react';
import { cn, formatDuration, formatViews } from '@/lib/utils';

type ContentType = 'VIDEO' | 'NOTES' | 'PDF' | 'EXERCISE_SOLUTIONS';

interface ContentCardProps {
  id: string;
  title: string;
  type: ContentType;
  views: number;
  duration?: number | null;
  isPremium: boolean;
  creator: { name: string | null };
  isSubscribed?: boolean;
}

const typeConfig: Record<ContentType, { icon: React.ElementType; label: string; color: string }> = {
  VIDEO: { icon: Play, label: 'Video', color: 'bg-red-100 text-red-700' },
  NOTES: { icon: BookOpen, label: 'Notes', color: 'bg-blue-100 text-blue-700' },
  PDF: { icon: FileText, label: 'PDF', color: 'bg-orange-100 text-orange-700' },
  EXERCISE_SOLUTIONS: { icon: PenTool, label: 'Exercises', color: 'bg-green-100 text-green-700' },
};

export function ContentCard({ id, title, type, views, duration, isPremium, creator, isSubscribed }: ContentCardProps) {
  const { icon: Icon, label, color } = typeConfig[type];
  const locked = isPremium && !isSubscribed;

  return (
    <Link
      href={`/content/${id}`}
      className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow group"
    >
      <div className={cn('p-2 rounded-lg flex-shrink-0', color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
            {title}
          </h3>
          {locked && <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className={cn('badge', color)}>{label}</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViews(views)}
          </span>
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">by {creator.name ?? 'Anonymous'}</p>
      </div>
    </Link>
  );
}
