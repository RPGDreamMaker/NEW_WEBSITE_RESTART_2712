import { Trophy } from 'lucide-react';

interface RankDisplayProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankDisplay({ rank, size = 'sm' }: RankDisplayProps) {
  if (rank > 3) {
    return <span className="font-mono font-bold text-gray-600">#{rank}</span>;
  }

  const config = {
    1: { color: 'text-yellow-500', bg: 'bg-yellow-50' },
    2: { color: 'text-gray-400', bg: 'bg-gray-50' },
    3: { color: 'text-amber-600', bg: 'bg-amber-50' },
  }[rank];

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <div className="flex items-center gap-1 justify-end">
      <Trophy className={`${sizeClasses} ${config.color}`} />
      <span className={`font-mono font-bold ${config.color}`}>#{rank}</span>
    </div>
  );
}