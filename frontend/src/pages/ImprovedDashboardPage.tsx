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
import { clsx } from "clsx";
import "../styles/dashboard.css";
import "../styles/habit-dashboard.css";
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
    <div className="min-h-screen relative">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-3xl animate-float-orb" />
        <div className="absolute top-1/2 -right-1/4 h-96 w-96 rounded-full bg-gradient-to-tl from-blue-500 to-cyan-500 opacity-20 blur-3xl animate-float-orb" style={{ animationDelay: '5s' }} />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 opacity-20 blur-3xl animate-float-orb" style={{ animationDelay: '10s' }} />
      </div>
      
      {/* Celebration Effects */}
      <Confetti show={showCelebration} />
      
      {/* Points Animation */}
      {earnedPoints > 0 && (
        <div className="points-animation fixed top-20 right-4 text-3xl font-bold z-50">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-bounce">
            +{earnedPoints} ✨
          </span>
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
      
      {/* Welcome Header - Colorful Banner */}
      <div className="relative overflow-hidden mb-6 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white mb-2 animate-gradient-text">
                Welcome back, {user?.firstName}! {todayProgress === 100 ? '🎉' : '👋'}
              </h2>
              <p className="text-lg text-white/90">
                {todayProgress === 100 
                  ? "Perfect day! All habits completed! You're on fire!" 
                  : `You're ${Math.round(todayProgress)}% done with today's habits. Keep going!`}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <QuickStats stats={stats} />
            </div>
          </div>
          
          {/* Level Progress - Rainbow Style */}
          <div className="mt-6">
            <div className="flex justify-between text-sm font-medium text-white mb-2">
              <span className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                Level {stats.currentLevel}
              </span>
              <span className="text-white/90">
                {Math.round(stats.nextLevelProgress)}% to Level {stats.currentLevel + 1}
              </span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 transition-all duration-1000 animate-progress-fill relative overflow-hidden"
                style={{ width: `${stats.nextLevelProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Colorful Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:scale-105 transition-transform cursor-pointer">
          <div className="relative z-10">
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-2xl font-bold">{stats.completedToday || 0}</div>
            <div className="text-sm opacity-90">Completed Today</div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
        </div>
        
        <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-105 transition-transform cursor-pointer">
          <div className="relative z-10">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold">{stats.currentStreak || 0}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
        </div>
        
        <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:scale-105 transition-transform cursor-pointer">
          <div className="relative z-10">
            <div className="text-3xl mb-1">⚡</div>
            <div className="text-2xl font-bold">{stats.totalPoints || 0}</div>
            <div className="text-sm opacity-90">Total Points</div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
        </div>
        
        <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-orange-500 to-yellow-500 text-white hover:scale-105 transition-transform cursor-pointer">
          <div className="relative z-10">
            <div className="text-3xl mb-1">📈</div>
            <div className="text-2xl font-bold">{stats.weeklyAverage || 0}%</div>
            <div className="text-sm opacity-90">Weekly Average</div>
          </div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
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
