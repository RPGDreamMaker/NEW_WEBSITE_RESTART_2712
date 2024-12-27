import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import Modal from '../ui/Modal';
import LoadingSpinner from '../layout/LoadingSpinner';
import RankDisplay from './RankDisplay';

type Student = Database['public']['Tables']['students']['Row'];

interface StudentScore {
  student: Student;
  points: number;
}

interface ActivityScoreboardModalProps {
  activityId: string;
  activityName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityScoreboardModal({
  activityId,
  activityName,
  isOpen,
  onClose,
}: ActivityScoreboardModalProps) {
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScores() {
      if (!isOpen) return;
      
      try {
        const { data: points, error: pointsError } = await supabase
          .from('activity_points')
          .select('*, student:students(*)')
          .eq('activity_id', activityId)
          .order('points', { ascending: false });

        if (pointsError) throw pointsError;

        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', (points?.[0]?.student as Student)?.class_id);

        if (studentsError) throw studentsError;

        const allScores: StudentScore[] = students.map(student => ({
          student,
          points: points?.find(p => p.student_id === student.id)?.points || 0
        })).sort((a, b) => b.points - a.points);

        setScores(allScores);
      } catch (err) {
        console.error('Failed to load scores:', err);
        setError('Failed to load scoreboard');
      } finally {
        setIsLoading(false);
      }
    }

    loadScores();
  }, [activityId, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Class Scoreboard - ${activityName}`}
    >
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-4">{error}</div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto -mx-6">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scores.map((score, index) => (
                <tr 
                  key={score.student.id} 
                  className={index < 3 ? `bg-${index === 0 ? 'yellow' : index === 1 ? 'gray' : 'amber'}-50` : ''}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                    <RankDisplay rank={index + 1} size="sm" />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                    <span className="font-medium text-gray-900">
                      {score.student.last_name} {score.student.first_name}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-right">
                    <span className="font-mono font-bold text-blue-600">
                      {score.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}