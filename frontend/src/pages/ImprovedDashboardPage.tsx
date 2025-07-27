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
import { useTheme } from "@/contexts/useTheme";
import "../styles/dashboard.css";
import "../styles/habit-dashboard.css";

const ImprovedDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isEncryptionEnabled } = useEncryption();
  const { theme } = useTheme();
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
  
  // Determine if we should show vibrant effects
  const isVibrantTheme = theme === 'balloon' || theme === 'vibrant';
  const isDarkTheme = theme === 'dark' || theme === 'midnight';
  
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
      {/* Debug: Show current theme */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg">
          Theme: <span className="text-yellow-400">{theme}</span>
          {theme !== 'balloon' && (
            <button 
              onClick={() => {
                localStorage.setItem('theme-preference', 'balloon');
                window.location.reload();
              }}
              className="ml-3 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
            >
              Switch to Balloon 🎈
            </button>
          )}
        </div>
      )}
      
      {/* Enhanced Animated Background for Balloon Theme */}
      {theme === 'balloon' && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Balloon cluster arrangement inspired by the image */}
          {/* Large main balloons */}
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-[#8b5cf6] opacity-20 blur-2xl animate-float-orb" />
          <div className="absolute top-0 right-20 h-72 w-72 rounded-full bg-[#ec4899] opacity-25 blur-2xl animate-float-orb" style={{ animationDelay: '2s' }} />
          <div className="absolute top-40 left-1/3 h-56 w-56 rounded-full bg-[#06b6d4] opacity-20 blur-2xl animate-float-orb" style={{ animationDelay: '4s' }} />
          
          {/* Medium balloons */}
          <div className="absolute top-20 right-1/3 h-48 w-48 rounded-full bg-[#f9a8d4] opacity-25 blur-xl animate-float-orb" style={{ animationDelay: '1s' }} />
          <div className="absolute top-60 left-20 h-40 w-40 rounded-full bg-[#8b5cf6] opacity-20 blur-xl animate-float-orb" style={{ animationDelay: '3s' }} />
          <div className="absolute top-32 right-10 h-44 w-44 rounded-full bg-[#ec4899] opacity-25 blur-xl animate-float-orb" style={{ animationDelay: '5s' }} />
          
          {/* Small accent balloons */}
          <div className="absolute top-5 left-1/2 h-32 w-32 rounded-full bg-[#06b6d4] opacity-30 blur-lg animate-float-orb" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-48 right-1/4 h-28 w-28 rounded-full bg-[#f9a8d4] opacity-30 blur-lg animate-float-orb" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-80 left-1/4 h-36 w-36 rounded-full bg-[#8b5cf6] opacity-25 blur-lg animate-float-orb" style={{ animationDelay: '4.5s' }} />
          
          {/* Bottom layer balloons */}
          <div className="absolute bottom-20 left-10 h-56 w-56 rounded-full bg-[#ec4899] opacity-20 blur-2xl animate-float-orb" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[#06b6d4] opacity-25 blur-2xl animate-float-orb" style={{ animationDelay: '3.5s' }} />
          <div className="absolute bottom-40 left-1/2 h-48 w-48 rounded-full bg-[#f9a8d4] opacity-20 blur-xl animate-float-orb" style={{ animationDelay: '5.5s' }} />
        </div>
      )}
      
      {/* Standard animated background for other themes */}
      {theme !== 'balloon' && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className={`absolute top-0 -left-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl animate-float-orb ${
            isVibrantTheme ? 'bg-gradient-to-br from-[#ff006e] to-[#8338ec]' : 
            isDarkTheme ? 'bg-accent/30' : 
            'bg-accent/20'
          }`} />
          <div className={`absolute top-1/2 -right-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl animate-float-orb ${
            isVibrantTheme ? 'bg-gradient-to-tl from-[#3a86ff] to-[#ff006e]' : 
            isDarkTheme ? 'bg-accent/30' : 
            'bg-accent/20'
          }`} style={{ animationDelay: '5s' }} />
        </div>
      )}
      
      {/* Celebration Effects */}
      <Confetti show={showCelebration} />
      
      {/* Points Animation */}
      {earnedPoints > 0 && (
        <div className="points-animation fixed top-20 right-4 text-3xl font-bold z-50">
          <span className={`${
            theme === 'balloon' ? 'bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#06b6d4]' :
            isVibrantTheme ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
            'bg-gradient-to-r from-accent to-accent-hover'
          } bg-clip-text text-transparent animate-bounce`}>
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
      
      {/* Enhanced Welcome Header */}
      <div className="welcome-banner relative overflow-hidden mb-6 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
        <div className={`absolute inset-0 ${
          theme === 'balloon' ? 'bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#06b6d4]' :
          isVibrantTheme ? 'bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#3a86ff]' :
          'bg-gradient-to-r from-accent via-accent-hover to-accent'
        }`} />
        {/* Enhanced overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20" />
        
        {/* Enhanced balloon decorations in banner */}
        {theme === 'balloon' && (
          <>
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#f9a8d4] opacity-40 blur-xl animate-float-orb" />
            <div className="absolute -top-5 left-1/4 w-24 h-24 rounded-full bg-[#06b6d4] opacity-35 blur-lg animate-float-orb" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#8b5cf6] opacity-40 blur-xl animate-float-orb" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 right-1/3 w-28 h-28 rounded-full bg-[#ec4899] opacity-35 blur-lg animate-float-orb" style={{ animationDelay: '3s' }} />
          </>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0 bg-black/10 backdrop-blur-sm rounded-lg p-4">
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                Welcome back, {user?.firstName}! <span className="inline-block">{todayProgress === 100 ? '🎉' : theme === 'balloon' ? '🎈' : '👋'}</span>
              </h2>
              <p className="text-lg text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {todayProgress === 100 
                  ? "Perfect day! All habits completed! You're on fire!" 
                  : `You're ${Math.round(todayProgress)}% done with today's habits. Keep going!`}
              </p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4">
              <QuickStats stats={stats} />
            </div>
          </div>
          
          {/* Enhanced Level Progress */}
          <div className="mt-6 bg-black/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex justify-between text-sm font-medium text-white mb-2">
              <span className="flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                <span className="text-2xl">{theme === 'balloon' ? '🎈' : '⭐'}</span>
                Level {stats.currentLevel}
              </span>
              <span className="text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {Math.round(stats.nextLevelProgress)}% to Level {stats.currentLevel + 1}
              </span>
            </div>
            <div className={`h-5 ${theme === 'balloon' ? 'bg-white/40' : 'bg-white/30'} rounded-full overflow-hidden backdrop-blur-sm shadow-inner`}>
              <div 
                className={`h-full ${
                  theme === 'balloon' ? 'bg-gradient-to-r from-[#f9a8d4] via-[#ec4899] via-[#8b5cf6] to-[#06b6d4]' :
                  isVibrantTheme ? 'bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#3a86ff]' :
                  'bg-gradient-to-r from-accent to-accent-hover'
                } transition-all duration-1000 animate-progress-fill relative overflow-hidden shadow-lg`}
                style={{ width: `${stats.nextLevelProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Stats Cards with Theme-Specific Styling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl group ${
          theme === 'balloon' 
            ? 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] hover:from-[#06b6d4] hover:to-[#0e7490]' 
            : isVibrantTheme
            ? 'bg-gradient-to-br from-[#3a86ff] to-[#0066ff]'
            : isDarkTheme
            ? 'glass-morphism border border-white/10'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <div className="relative z-10">
            <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">
              {theme === 'balloon' ? '🎯' : '✓'}
            </div>
            <div className="text-3xl font-bold drop-shadow-lg">{stats.habitsCompletedToday || 0}</div>
            <div className="text-sm font-medium opacity-95">Completed Today</div>
          </div>
          {theme === 'balloon' && (
            <>
              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-white/20 blur-xl" />
              <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/30 blur-lg animate-pulse" />
            </>
          )}
        </div>
        
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl group ${
          theme === 'balloon' 
            ? 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] hover:from-[#8b5cf6] hover:to-[#6b21a8]' 
            : isVibrantTheme
            ? 'bg-gradient-to-br from-[#8338ec] to-[#5f00d9]'
            : isDarkTheme
            ? 'glass-morphism border border-white/10'
            : 'bg-gradient-to-br from-purple-500 to-purple-600'
        }`}>
          <div className="relative z-10">
            <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform animate-fire-flicker">🔥</div>
            <div className="text-3xl font-bold drop-shadow-lg">{stats.weeklyStreak || 0}</div>
            <div className="text-sm font-medium opacity-95">Day Streak</div>
          </div>
          {theme === 'balloon' && (
            <>
              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-white/20 blur-xl" />
              <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/30 blur-lg animate-pulse" />
            </>
          )}
        </div>
        
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl group ${
          theme === 'balloon' 
            ? 'bg-gradient-to-br from-[#ec4899] to-[#db2777] hover:from-[#ec4899] hover:to-[#be185d]' 
            : isVibrantTheme
            ? 'bg-gradient-to-br from-[#ff006e] to-[#d6005a]'
            : isDarkTheme
            ? 'glass-morphism border border-white/10'
            : 'bg-gradient-to-br from-pink-500 to-pink-600'
        }`}>
          <div className="relative z-10">
            <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">⚡</div>
            <div className="text-3xl font-bold drop-shadow-lg">{stats.totalPoints || 0}</div>
            <div className="text-sm font-medium opacity-95">Total Points</div>
          </div>
          {theme === 'balloon' && (
            <>
              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-white/20 blur-xl" />
              <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/30 blur-lg animate-pulse" />
            </>
          )}
        </div>
        
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl group ${
          theme === 'balloon' 
            ? 'bg-gradient-to-br from-[#f9a8d4] to-[#f472b6] hover:from-[#f9a8d4] hover:to-[#ec4899]' 
            : isVibrantTheme
            ? 'bg-gradient-to-br from-[#ffb700] to-[#ff8800]'
            : isDarkTheme
            ? 'glass-morphism border border-white/10'
            : 'bg-gradient-to-br from-amber-500 to-amber-600'
        }`}>
          <div className="relative z-10">
            <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">
              {theme === 'balloon' ? '🎈' : '⭐'}
            </div>
            <div className="text-3xl font-bold drop-shadow-lg">{stats.perfectDays || 0}</div>
            <div className="text-sm font-medium opacity-95">Perfect Days</div>
          </div>
          {theme === 'balloon' && (
            <>
              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-white/20 blur-xl" />
              <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/30 blur-lg animate-pulse" />
            </>
          )}
        </div>
      </div>
      
      {/* Main Content with Enhanced Glass Effects for Balloon Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Tracker - 2 columns */}
        <div className="lg:col-span-2">
          <div className={theme === 'balloon' ? 'balloon-theme-container' : ''}>
            <DailyHabitTracker 
              habits={habits}
              onHabitToggle={handleHabitToggle}
              onSkipHabit={skipHabit}
            />
          </div>
        </div>
        
        {/* Sidebar with Enhanced Styling */}
        <div className="space-y-6">
          <div className={theme === 'balloon' ? 'balloon-theme-container' : ''}>
            <MotivationalQuote />
          </div>
          <div className={theme === 'balloon' ? 'balloon-theme-container' : ''}>
            <WeeklyProgressChart habits={habits} />
          </div>
          <div className={theme === 'balloon' ? 'balloon-theme-container' : ''}>
            <QuickActions />
          </div>
          <div className={theme === 'balloon' ? 'balloon-theme-container' : ''}>
            <UpcomingChallenges />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedDashboardPage;