import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts";
import { EncryptionOnboarding } from "../components/EncryptionOnboarding";
import { useEncryption } from "../contexts/useEncryption";
import { DailyHabitTracker } from "@/features/habits/components/DailyHabitTracker";
import { WeeklyProgressChart } from "@/features/habits/components/WeeklyProgressChart";
import { MotivationalQuote } from "@/features/habits/components/MotivationalQuote";
import { QuickStats } from "@/features/habits/components/QuickStats";
import { DashboardSkeleton } from "@/features/habits/components/DashboardSkeleton";
import { QuickActions } from "@/features/habits/components/QuickActions";
import { UpcomingChallenges } from "@/features/habits/components/UpcomingChallenges";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { Confetti } from "@/components/common/Confetti";
// import { useNavigate } from "react-router-dom";

const ImprovedDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isEncryptionEnabled } = useEncryption();
  // const navigate = useNavigate(); // TODO: Use for navigation
  const { 
    habits, 
    stats, 
    checkInHabit, 
    skipHabit, 
    isLoading 
  } = useHabits();
  
  const [showEncryptionBanner, setShowEncryptionBanner] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  
  // Calculate dynamic stats
  const todayProgress = habits.length > 0 
    ? (habits.filter(h => h.completedToday).length / habits.length * 100)
    : 0;
  // const activeGoals = habits.filter(h => h.currentStreak > 0).length; // TODO: Use for stats display
  
  useEffect(() => {
    const dismissed = localStorage.getItem("encryptionBannerDismissed");
    if (dismissed === "true") {
      setShowEncryptionBanner(false);
    }
  }, []);
  
  const handleHabitToggle = async (habitId: string, completed: boolean) => {
    try {
      const result = await checkInHabit(habitId, completed);
      
      if (result && 'points' in result && result.points > 0) {
        setEarnedPoints(result.points);
        setTimeout(() => setEarnedPoints(0), 3000);
      }
      
      if (result && 'milestone' in result && result.milestone) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (error) {
      console.error("Failed to check in habit:", error);
    }
  };
  
  const handleDismissEncryptionBanner = () => {
    setShowEncryptionBanner(false);
    localStorage.setItem("encryptionBannerDismissed", "true");
  };
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="min-h-screen">
      {/* Celebration Effects */}
      <Confetti show={showCelebration} />
      
      {/* Points Animation */}
      {earnedPoints > 0 && (
        <div className="points-animation fixed top-20 right-4 text-2xl font-bold text-green-500 z-50">
          +{earnedPoints}
        </div>
      )}
      
      {/* Encryption Banner */}
      {showEncryptionBanner && !isEncryptionEnabled && (
        <div className="-mx-4 -mt-6 mb-6 sm:-mx-6 lg:-mx-8">
          <EncryptionOnboarding
            variant="banner"
            onDismiss={handleDismissEncryptionBanner}
          />
        </div>
      )}
      
      {/* Welcome Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Welcome back, {user?.firstName}! 
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {todayProgress === 100 
                  ? "🎉 Perfect day! All habits completed!" 
                  : `You're ${Math.round(todayProgress)}% done with today's habits. Keep going!`}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <QuickStats stats={stats} />
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Level {stats.currentLevel}</span>
              <span>{Math.round(stats.nextLevelProgress)}% to Level {stats.currentLevel + 1}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500 progress-shine"
                style={{ width: `${stats.nextLevelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Tracker - 2 columns */}
        <div className="lg:col-span-2">
          <DailyHabitTracker 
            habits={habits}
            onHabitToggle={handleHabitToggle}
            onSkipHabit={skipHabit}
          />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <MotivationalQuote />
          <WeeklyProgressChart habits={habits} />
          <QuickActions />
          <UpcomingChallenges />
        </div>
      </div>
    </div>
  );
};



export default ImprovedDashboardPage;
