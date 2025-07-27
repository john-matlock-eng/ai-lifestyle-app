import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts";
import { EncryptionOnboarding } from "../components/EncryptionOnboarding";
import { useEncryption } from "../contexts/useEncryption";
import { useEnhancedAuthShihTzu } from "../hooks/useEnhancedAuthShihTzu";
import { CompanionTutorial } from "../features/tutorials";
import { clsx } from "clsx";
import "../styles/dashboard.css";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isEncryptionEnabled } = useEncryption();
  const [showEncryptionBanner, setShowEncryptionBanner] = useState(true);
  const [greeting, setGreeting] = useState("");
  const companion = useEnhancedAuthShihTzu();

  // Check if user has dismissed the banner before
  useEffect(() => {
    const dismissed = localStorage.getItem("encryptionBannerDismissed");
    if (dismissed === "true") {
      setShowEncryptionBanner(false);
    }
  }, []);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleDismissEncryptionBanner = () => {
    setShowEncryptionBanner(false);
    localStorage.setItem("encryptionBannerDismissed", "true");
  };

  // Quick stats data with gradients
  const statsCards = [
    {
      title: "Today's Meals",
      value: "3",
      subValue: "1,245 cal",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Weekly Workouts",
      value: "5",
      subValue: "2h 15m",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-500/10 to-yellow-500/10",
    },
    {
      title: "Wellness Score",
      value: "87",
      subValue: "+5 this week",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-500/10 to-rose-500/10",
    },
    {
      title: "Active Goals",
      value: "12",
      subValue: "3 completed",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
    },
  ];

  // Quick actions with colorful backgrounds
  const quickActions: {
    title: string;
    description: string;
    icon: string;
    href: string;
    gradient: string;
    hoverGradient: string;
    className?: string;
  }[] = [
    {
      title: "New Habit",
      description: "Build healthy routines",
      icon: "🎯",
      href: "/habits/new",
      gradient: "from-purple-600 to-pink-600",
      hoverGradient: "hover:from-purple-700 hover:to-pink-700",
      className: "new-habit-button",
    },
    {
      title: "Start Workout",
      description: "Begin exercise session",
      icon: "💪",
      href: "/workouts/new",
      gradient: "from-blue-600 to-cyan-600",
      hoverGradient: "hover:from-blue-700 hover:to-cyan-700",
    },
    {
      title: "Journal Entry",
      description: "Record your thoughts",
      icon: "📝",
      href: "/journal/new",
      gradient: "from-emerald-600 to-teal-600",
      hoverGradient: "hover:from-emerald-700 hover:to-teal-700",
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      type: "meal",
      title: "Healthy Breakfast",
      time: "2 hours ago",
      icon: "🥗",
    },
    {
      type: "workout",
      title: "Morning Run - 5km",
      time: "5 hours ago",
      icon: "🏃",
    },
    {
      type: "journal",
      title: "Daily Reflection",
      time: "Yesterday",
      icon: "📔",
    },
    {
      type: "goal",
      title: "Completed: Drink 8 glasses of water",
      time: "Yesterday",
      icon: "✅",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] opacity-10 blur-3xl animate-float-orb" />
        <div
          className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-tl from-[var(--success)] to-[var(--accent)] opacity-10 blur-3xl animate-float-orb"
          style={{ animationDelay: "10s" }}
        />
      </div>

      {/* Encryption Onboarding Banner */}
      {showEncryptionBanner && !isEncryptionEnabled && (
        <div className="encryption-banner -mx-4 -mt-6 mb-6 sm:-mx-6 lg:-mx-8">
          <EncryptionOnboarding
            variant="banner"
            onDismiss={handleDismissEncryptionBanner}
          />
        </div>
      )}

      {/* Welcome Section with Gradient Text */}
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--success)] bg-clip-text text-transparent animate-gradient-text">
            {greeting}, {user?.firstName}!
          </span>
        </h1>
        <p className="text-lg text-[var(--text-muted)]">
          Here's your wellness overview for today
        </p>
      </div>

      {/* Stats Cards with Gradient Backgrounds */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={clsx(
              "relative overflow-hidden rounded-xl p-6",
              "bg-gradient-to-br bg-[var(--surface)] border border-[var(--surface-muted)]",
              "hover:border-[var(--accent)] transition-all duration-300 hover:shadow-lg",
              "group cursor-pointer",
            )}
          >
            {/* Background gradient overlay */}
            <div
              className={clsx(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                card.bgGradient,
              )}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={clsx(
                    "p-2 rounded-lg bg-gradient-to-br text-white",
                    card.gradient,
                  )}
                >
                  {card.icon}
                </div>
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-1">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-[var(--text)] mb-1">
                {card.value}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {card.subValue}
              </p>
            </div>

            {/* Decorative elements */}
            <div
              className={clsx(
                "absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-10",
                card.gradient,
              )}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions with Colorful Buttons */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className={clsx(
                "relative overflow-hidden rounded-xl p-6 text-white shine-effect",
                "bg-gradient-to-br transition-all duration-300",
                "hover:scale-105 hover:shadow-xl",
                action.gradient,
                action.hoverGradient,
                action.className,
              )}
            >
              <div className="relative z-10">
                <span className="text-4xl mb-3 block icon-bounce">
                  {action.icon}
                </span>
                <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </div>

              {/* Decorative shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 transform translate-x-full hover:translate-x-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout for Activities and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--surface-muted)] p-6">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">
            Recent Activities
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className={clsx(
                  "flex items-center gap-4 p-3 rounded-lg",
                  "bg-[var(--surface-hover)] hover:bg-[var(--button-hover-bg)]",
                  "transition-all duration-200 cursor-pointer group",
                )}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform icon-bounce">
                  {activity.icon}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--text)]">
                    {activity.title}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {activity.time}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--surface-muted)] p-6">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">
            Weekly Progress
          </h2>

          {/* Progress bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text)]">
                  Nutrition Goals
                </span>
                <span className="text-sm text-[var(--text-muted)]">75%</span>
              </div>
              <div className="h-3 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 animate-progress-fill"
                  style={{ width: "75%" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text)]">
                  Exercise Minutes
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  120/150
                </span>
              </div>
              <div className="h-3 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 animate-progress-fill"
                  style={{ width: "80%", animationDelay: "0.2s" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text)]">
                  Sleep Quality
                </span>
                <span className="text-sm text-[var(--text-muted)]">92%</span>
              </div>
              <div className="h-3 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 animate-progress-fill"
                  style={{ width: "92%", animationDelay: "0.4s" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text)]">
                  Hydration
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  6/8 glasses
                </span>
              </div>
              <div className="h-3 bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500 animate-progress-fill"
                  style={{ width: "75%", animationDelay: "0.6s" }}
                />
              </div>
            </div>
          </div>

          {/* Motivational message */}
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[var(--accent)]/10 to-[var(--success)]/10 border border-[var(--accent)]/20">
            <p className="text-sm text-[var(--text)]">
              <span className="font-semibold">Great progress!</span> You're on
              track to meet 3 out of 4 weekly goals. Keep it up! 🎯
            </p>
          </div>
        </div>
      </div>

      {/* Account Security Card with Gradient Border */}
      <div className="mt-8 relative rounded-xl overflow-hidden">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--success)] opacity-20" />
        <div className="relative bg-[var(--surface)] m-[1px] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Account Security
            </h3>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--success)]/10 text-[var(--success)]">
              Secure
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <svg
                  className="w-5 h-5 text-[var(--success)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  Email Verified
                </p>
                <p className="text-xs text-[var(--text-muted)]">Protected</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "p-2 rounded-lg",
                  isEncryptionEnabled
                    ? "bg-[var(--success)]/10"
                    : "bg-[var(--warning)]/10",
                )}
              >
                <svg
                  className={clsx(
                    "w-5 h-5",
                    isEncryptionEnabled
                      ? "text-[var(--success)]"
                      : "text-[var(--warning)]",
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  Encryption
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {isEncryptionEnabled ? "Enabled" : "Available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "p-2 rounded-lg",
                  user?.mfaEnabled
                    ? "bg-[var(--success)]/10"
                    : "bg-[var(--surface-hover)]",
                )}
              >
                <svg
                  className={clsx(
                    "w-5 h-5",
                    user?.mfaEnabled
                      ? "text-[var(--success)]"
                      : "text-[var(--text-muted)]",
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">2FA</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {user?.mfaEnabled ? "Active" : "Not Set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Companion Tutorial System */}
      <CompanionTutorial companion={companion} pageId="dashboard" />
    </div>
  );
};

export default DashboardPage;
