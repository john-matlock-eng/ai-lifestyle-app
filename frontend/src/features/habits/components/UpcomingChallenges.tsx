import React from 'react';
import { Calendar, Award, Users } from 'lucide-react';

export const UpcomingChallenges: React.FC = () => {
  const challenges = [
    {
      title: '30-Day Consistency',
      description: 'Complete all habits for 30 days',
      daysLeft: 23,
      participants: 1284,
      icon: <Award className="w-5 h-5 text-warning" />
    },
    {
      title: 'Weekend Warrior',
      description: 'Keep your streak through weekends',
      daysLeft: 2,
      participants: 892,
      icon: <Calendar className="w-5 h-5 text-accent" />
    },
    {
      title: 'Community Goals',
      description: 'Join others in shared habits',
      daysLeft: 5,
      participants: 3421,
      icon: <Users className="w-5 h-5 text-success" />
    }
  ];
  
  return (
    <div className="glass rounded-lg p-4 border border-surface-muted hover-lift">
      <h3 className="text-sm font-semibold text-theme mb-3">Upcoming Challenges</h3>
      <div className="space-y-3">
        {challenges.map((challenge, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-surface-muted hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-surface">
                {challenge.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-theme">{challenge.title}</h4>
                <p className="text-xs text-muted mt-1">{challenge.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-accent">{challenge.daysLeft} days left</span>
                  <span className="text-xs text-muted">{challenge.participants} joined</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
