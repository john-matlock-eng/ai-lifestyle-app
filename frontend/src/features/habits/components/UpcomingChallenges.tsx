import React from 'react';
import { Calendar, Award, Users, Clock } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  duration: string;
  participants: number;
  reward: string;
  icon: React.ReactNode;
  color: string;
}

export const UpcomingChallenges: React.FC = () => {
  // This would normally come from an API
  const challenges: Challenge[] = [
    {
      id: '1',
      title: '30-Day Meditation',
      description: 'Meditate for 10 minutes daily',
      startDate: 'Jan 1',
      duration: '30 days',
      participants: 234,
      reward: '500 points',
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-purple-400 to-pink-400'
    },
    {
      id: '2',
      title: 'Fitness February',
      description: 'Complete any workout daily',
      startDate: 'Feb 1',
      duration: '28 days',
      participants: 567,
      reward: '750 points',
      icon: <Award className="w-5 h-5" />,
      color: 'from-green-400 to-blue-400'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Challenges</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="relative overflow-hidden rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${challenge.color} opacity-5`}
            />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${challenge.color} text-white`}>
                    {challenge.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                    <p className="text-xs text-gray-600">{challenge.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{challenge.startDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{challenge.participants}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-yellow-600 font-medium">
                  <Award className="w-3 h-3" />
                  <span>{challenge.reward}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Join challenges to earn bonus points and connect with others!
        </p>
      </div>
    </div>
  );
};
