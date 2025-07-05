"""
Service layer for goal progress retrieval and analytics.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import Counter
from aws_lambda_powertools import Logger

from goals_common import (
    Goal, GoalActivity, GoalStatus,
    GoalsRepository, ProgressCalculator, DateHelper,
    GoalNotFoundError, GoalPermissionError, GoalError
)

logger = Logger()


class GetProgressService:
    """Handles goal progress retrieval and analytics."""
    
    def __init__(self):
        self.repository = GoalsRepository()
    
    def get_goal_progress(self, user_id: str, goal_id: str, period: str = 'current') -> Dict[str, Any]:
        """
        Get goal progress with analytics and insights.
        
        Args:
            user_id: User's unique identifier
            goal_id: Goal's unique identifier
            period: Time period for analysis
            
        Returns:
            Progress data with statistics and insights
            
        Raises:
            GoalNotFoundError: If goal doesn't exist
            GoalPermissionError: If user doesn't own the goal
        """
        # Get the goal
        goal = self.repository.get_goal(user_id, goal_id)
        
        if not goal:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise GoalNotFoundError(goal_id, user_id)
        
        # Verify ownership
        if goal.userId != user_id:
            logger.warning(f"User {user_id} attempted to access progress for goal {goal_id} owned by {goal.userId}")
            raise GoalPermissionError("view progress", goal_id)
        
        # Get activities for the period
        activities = self._get_activities_for_period(user_id, goal_id, period)
        
        # Calculate progress based on goal pattern
        progress = self._calculate_progress(goal, activities)
        
        # Calculate statistics
        statistics = self._calculate_statistics(goal, activities, period)
        
        # Generate insights
        insights = self._generate_insights(goal, activities, progress, statistics)
        
        logger.info(f"Retrieved progress for goal {goal_id}: {progress.percentComplete}% complete")
        
        return {
            'goalId': goal_id,
            'period': period,
            'progress': progress.model_dump(by_alias=True),
            'statistics': statistics,
            'insights': insights
        }
    
    def _get_activities_for_period(
        self, 
        user_id: str, 
        goal_id: str, 
        period: str
    ) -> List[GoalActivity]:
        """Get activities for the specified period."""
        now = datetime.utcnow()
        
        if period == 'current':
            # Get last 30 days
            start_date = now - timedelta(days=30)
        elif period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'quarter':
            start_date = now - timedelta(days=90)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:  # 'all'
            start_date = None
        
        activities = self.repository.get_goal_activities(
            user_id,
            goal_id,
            start_date=start_date,
            limit=1000  # Get more for analysis
        )
        
        return activities
    
    def _calculate_progress(self, goal: Goal, activities: List[GoalActivity]) -> Any:
        """Calculate progress based on goal pattern."""
        if goal.goalPattern == 'recurring':
            return ProgressCalculator.calculate_recurring_progress(goal, activities)
        elif goal.goalPattern == 'milestone':
            return ProgressCalculator.calculate_milestone_progress(goal, activities)
        elif goal.goalPattern == 'target':
            return ProgressCalculator.calculate_target_progress(goal, activities)
        elif goal.goalPattern == 'streak':
            return ProgressCalculator.calculate_streak_progress(goal, activities)
        elif goal.goalPattern == 'limit':
            return ProgressCalculator.calculate_limit_progress(goal, activities)
        else:
            return goal.progress  # Return existing progress
    
    def _calculate_statistics(
        self, 
        goal: Goal, 
        activities: List[GoalActivity], 
        period: str
    ) -> Dict[str, Any]:
        """Calculate statistics for the goal."""
        stats = {
            'totalActivities': len(activities),
            'completedActivities': 0,
            'skippedActivities': 0,
            'averageValue': 0.0,
            'bestValue': 0.0,
            'worstValue': 0.0,
            'consistency': 0.0
        }
        
        if not activities:
            return stats
        
        # Count by type
        type_counts = Counter(a.activityType.value for a in activities)
        stats['completedActivities'] = type_counts.get('completed', 0) + type_counts.get('progress', 0)
        stats['skippedActivities'] = type_counts.get('skipped', 0)
        
        # Calculate value statistics
        progress_activities = [a for a in activities if a.activityType in ['progress', 'completed']]
        if progress_activities:
            values = [a.value for a in progress_activities]
            stats['averageValue'] = sum(values) / len(values)
            stats['bestValue'] = max(values)
            stats['worstValue'] = min(values)
        
        # Calculate consistency (percentage of expected days with activity)
        if period != 'all' and goal.schedule:
            expected_days = self._get_expected_activity_days(goal, period)
            actual_days = len(set(a.activityDate.date() for a in activities))
            if expected_days > 0:
                stats['consistency'] = min(100, (actual_days / expected_days) * 100)
        
        return stats
    
    def _generate_insights(
        self, 
        goal: Goal, 
        activities: List[GoalActivity], 
        progress: Any,
        statistics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate insights based on activity patterns."""
        insights = {
            'bestTimeOfDay': None,
            'bestDayOfWeek': None,
            'successPatterns': [],
            'recommendations': []
        }
        
        if not activities:
            insights['recommendations'].append(
                "Start logging activities to build insights"
            )
            return insights
        
        # Find best time of day
        time_performance = self._analyze_time_performance(activities)
        if time_performance:
            insights['bestTimeOfDay'] = time_performance
        
        # Find best day of week
        day_performance = self._analyze_day_performance(activities)
        if day_performance:
            insights['bestDayOfWeek'] = day_performance
        
        # Identify success patterns
        if statistics['consistency'] > 80:
            insights['successPatterns'].append("High consistency - keep it up!")
        elif statistics['consistency'] < 50:
            insights['successPatterns'].append("Inconsistent activity - try setting reminders")
        
        if progress.trend == 'improving':
            insights['successPatterns'].append("Performance is improving over time")
        elif progress.trend == 'declining':
            insights['successPatterns'].append("Performance is declining - consider adjusting your approach")
        
        # Generate recommendations
        insights['recommendations'] = self._generate_recommendations(
            goal, activities, progress, statistics
        )
        
        return insights
    
    def _analyze_time_performance(self, activities: List[GoalActivity]) -> Optional[str]:
        """Find the best performing time of day."""
        time_values = {}
        
        for activity in activities:
            if activity.context and 'timeOfDay' in activity.context:
                time_of_day = activity.context['timeOfDay']
                if time_of_day not in time_values:
                    time_values[time_of_day] = []
                time_values[time_of_day].append(activity.value)
        
        if not time_values:
            return None
        
        # Calculate average performance by time
        time_averages = {
            time: sum(values) / len(values)
            for time, values in time_values.items()
        }
        
        # Return best performing time
        return max(time_averages, key=time_averages.get)
    
    def _analyze_day_performance(self, activities: List[GoalActivity]) -> Optional[str]:
        """Find the best performing day of week."""
        day_values = {}
        
        for activity in activities:
            day_of_week = activity.activityDate.strftime('%A').lower()
            if day_of_week not in day_values:
                day_values[day_of_week] = []
            day_values[day_of_week].append(activity.value)
        
        if not day_values:
            return None
        
        # Calculate average performance by day
        day_averages = {
            day: sum(values) / len(values)
            for day, values in day_values.items()
        }
        
        # Return best performing day
        return max(day_averages, key=day_averages.get)
    
    def _generate_recommendations(
        self,
        goal: Goal,
        activities: List[GoalActivity],
        progress: Any,
        statistics: Dict[str, Any]
    ) -> List[str]:
        """Generate personalized recommendations."""
        recommendations = []
        
        # Consistency recommendations
        if statistics['consistency'] < 50:
            recommendations.append(
                "Your consistency is below 50%. Try setting daily reminders or linking this goal to an existing habit."
            )
        
        # Progress-based recommendations
        if progress.percentComplete < 25 and len(activities) > 10:
            recommendations.append(
                "You're making slow progress. Consider breaking down your goal into smaller milestones."
            )
        elif progress.percentComplete > 75:
            recommendations.append(
                "You're close to your goal! Stay focused and maintain your current pace."
            )
        
        # Pattern-based recommendations
        if goal.goalPattern == 'streak' and progress.currentStreak == 0:
            recommendations.append(
                "Your streak was broken. Start fresh today - every journey begins with a single step!"
            )
        elif goal.goalPattern == 'limit' and progress.daysOverLimit > 5:
            recommendations.append(
                f"You've exceeded your limit {progress.daysOverLimit} times. Consider adjusting your target or identifying triggers."
            )
        
        # Value-based recommendations
        if statistics['averageValue'] < goal.target.value * 0.5:
            recommendations.append(
                "Your average performance is less than 50% of your target. Consider adjusting your goal or approach."
            )
        
        return recommendations[:3]  # Limit to top 3 recommendations
    
    def _get_expected_activity_days(self, goal: Goal, period: str) -> int:
        """Calculate expected activity days based on goal schedule."""
        if period == 'week':
            days = 7
        elif period == 'month':
            days = 30
        elif period == 'quarter':
            days = 90
        elif period == 'year':
            days = 365
        else:
            days = 30  # Default to month
        
        # Adjust based on goal frequency
        if goal.schedule and goal.schedule.frequency:
            if goal.schedule.frequency == 'daily':
                return days
            elif goal.schedule.frequency == 'weekly':
                return days // 7
            elif goal.schedule.frequency == 'monthly':
                return days // 30
        
        # Default to daily for recurring goals
        if goal.goalPattern in ['recurring', 'streak', 'limit']:
            return days
        
        return days // 7  # Default to weekly
