"""
Utility functions for the Enhanced Goal System.

Provides progress calculations, date helpers, and other utilities.
"""

import calendar
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from .models import (
    ActivityType,
    Goal,
    GoalActivity,
    GoalPattern,
    GoalProgress,
    Period,
    PeriodHistory,
    TrendDirection,
)


class ProgressCalculator:
    """Calculate progress for different goal patterns."""

    @staticmethod
    def calculate_recurring_progress(
        goal: Goal, activities: List[GoalActivity], current_date: Optional[datetime] = None
    ) -> GoalProgress:
        """Calculate progress for recurring goals."""
        if not current_date:
            current_date = datetime.utcnow()

        # Group activities by period
        period_data = ProgressCalculator._group_by_period(
            activities, goal.target.period, current_date
        )

        # Calculate success rate
        total_periods = len(period_data)
        successful_periods = sum(
            1 for period, data in period_data.items() if data["total"] >= goal.target.value
        )

        success_rate = (successful_periods / total_periods * 100) if total_periods > 0 else 0

        # Build period history
        period_history = []
        for period, data in period_data.items():
            period_history.append(
                PeriodHistory(
                    period=period,
                    achieved=data["total"] >= goal.target.value,
                    value=data["total"],
                    date=data["date"],
                )
            )

        # Get current period value
        current_period = ProgressCalculator._get_current_period_key(
            current_date, goal.target.period
        )
        current_period_value = period_data.get(current_period, {}).get("total", 0)

        # Determine trend
        trend = ProgressCalculator._calculate_trend(period_history)

        return GoalProgress(
            percent_complete=success_rate,
            last_activity_date=activities[0].activity_date if activities else None,
            current_period_value=current_period_value,
            period_history=period_history,
            success_rate=success_rate,
            trend=trend,
        )

    @staticmethod
    def calculate_milestone_progress(goal: Goal, activities: List[GoalActivity]) -> GoalProgress:
        """Calculate progress for milestone goals."""
        # Sum all progress activities
        total = sum(
            activity.value
            for activity in activities
            if activity.activity_type == ActivityType.PROGRESS
        )

        percent_complete = (
            min(100, (total / goal.target.value * 100)) if goal.target.value > 0 else 0
        )
        remaining = max(0, goal.target.value - total)

        # Calculate projected completion based on average rate
        projected_completion = None
        if activities and len(activities) >= 2:
            # Calculate average rate per day
            first_activity = min(activities, key=lambda a: a.activity_date)
            days_elapsed = (datetime.utcnow() - first_activity.activity_date).days
            if days_elapsed > 0:
                avg_rate_per_day = total / days_elapsed
                if avg_rate_per_day > 0:
                    days_remaining = remaining / avg_rate_per_day
                    projected_completion = datetime.utcnow() + timedelta(days=days_remaining)

        return GoalProgress(
            percent_complete=percent_complete,
            last_activity_date=activities[0].activity_date if activities else None,
            total_accumulated=total,
            remaining_to_goal=remaining,
            projected_completion=projected_completion,
            trend=ProgressCalculator._calculate_value_trend(activities),
        )

    @staticmethod
    def calculate_target_progress(goal: Goal, activities: List[GoalActivity]) -> GoalProgress:
        """Calculate progress for target goals."""
        if not goal.target.start_value:
            return GoalProgress(percent_complete=0)

        # Get the latest value
        latest_activity = max(
            (a for a in activities if a.activity_type == ActivityType.PROGRESS),
            key=lambda a: a.activity_date,
            default=None,
        )

        if not latest_activity:
            current_value = goal.target.start_value
        else:
            current_value = latest_activity.value
            goal.target.current_value = current_value  # Update the goal

        # Calculate progress based on direction
        total_change_needed = abs(goal.target.value - goal.target.start_value)
        current_change = abs(current_value - goal.target.start_value)

        if total_change_needed > 0:
            percent_complete = min(100, (current_change / total_change_needed * 100))
        else:
            percent_complete = 100 if current_value == goal.target.value else 0

        # Project completion
        projected_completion = None
        if activities and len(activities) >= 2:
            # Calculate rate of change
            first_activity = min(activities, key=lambda a: a.activity_date)
            days_elapsed = (datetime.utcnow() - first_activity.activity_date).days
            if days_elapsed > 0:
                total_change = current_value - goal.target.start_value
                avg_rate_per_day = total_change / days_elapsed
                if avg_rate_per_day != 0:
                    remaining_change = goal.target.value - current_value
                    days_remaining = abs(remaining_change / avg_rate_per_day)
                    projected_completion = datetime.utcnow() + timedelta(days=days_remaining)

        return GoalProgress(
            percent_complete=percent_complete,
            last_activity_date=latest_activity.activity_date if latest_activity else None,
            projected_completion=projected_completion,
            trend=ProgressCalculator._calculate_value_trend(activities),
        )

    @staticmethod
    def calculate_streak_progress(goal: Goal, activities: List[GoalActivity]) -> GoalProgress:
        """Calculate progress for streak goals."""
        if not activities:
            return GoalProgress(
                percent_complete=0,
                current_streak=0,
                longest_streak=0,
                target_streak=int(goal.target.value),
            )

        # Sort activities by date
        sorted_activities = sorted(activities, key=lambda a: a.activity_date)

        # Calculate streaks
        current_streak = 0
        longest_streak = 0
        last_date = None

        for activity in sorted_activities:
            if activity.activity_type != ActivityType.PROGRESS:
                continue

            activity_date = activity.activity_date.date()

            if last_date is None:
                current_streak = 1
            else:
                days_diff = (activity_date - last_date).days
                if days_diff == 1:
                    current_streak += 1
                elif days_diff > 1:
                    # Streak broken
                    longest_streak = max(longest_streak, current_streak)
                    current_streak = 1
                # If days_diff == 0, same day, don't increment

            last_date = activity_date

        # Check if current streak is still active
        if last_date:
            days_since_last = (date.today() - last_date).days
            if days_since_last > 1:
                # Streak broken
                longest_streak = max(longest_streak, current_streak)
                current_streak = 0

        longest_streak = max(longest_streak, current_streak)
        target_streak = int(goal.target.value)
        percent_complete = (
            min(100, (current_streak / target_streak * 100)) if target_streak > 0 else 0
        )

        return GoalProgress(
            percent_complete=percent_complete,
            last_activity_date=sorted_activities[-1].activity_date,
            current_streak=current_streak,
            longest_streak=longest_streak,
            target_streak=target_streak,
            trend=TrendDirection.IMPROVING if current_streak > 0 else TrendDirection.DECLINING,
        )

    @staticmethod
    def calculate_limit_progress(
        goal: Goal, activities: List[GoalActivity], current_date: Optional[datetime] = None
    ) -> GoalProgress:
        """Calculate progress for limit goals."""
        if not current_date:
            current_date = datetime.utcnow()

        # Group activities by period
        period_data = ProgressCalculator._group_by_period(
            activities, goal.target.period, current_date
        )

        # Calculate days over limit
        days_over_limit = 0
        total_value = 0
        total_days = len(period_data)

        period_history = []
        for period, data in period_data.items():
            over_limit = data["total"] > goal.target.value
            if over_limit:
                days_over_limit += 1

            total_value += data["total"]

            period_history.append(
                PeriodHistory(
                    period=period,
                    achieved=not over_limit,  # Achieved means stayed under limit
                    value=data["total"],
                    date=data["date"],
                )
            )

        # Calculate average and success rate
        average_value = total_value / total_days if total_days > 0 else 0
        days_within_limit = total_days - days_over_limit
        success_rate = (days_within_limit / total_days * 100) if total_days > 0 else 100

        # Determine trend
        trend = ProgressCalculator._calculate_trend(period_history)

        return GoalProgress(
            percent_complete=success_rate,
            last_activity_date=activities[0].activity_date if activities else None,
            period_history=period_history,
            average_value=average_value,
            days_over_limit=days_over_limit,
            success_rate=success_rate,
            trend=trend,
        )

    @staticmethod
    def _group_by_period(
        activities: List[GoalActivity], period: Period, end_date: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """Group activities by period and calculate totals."""
        period_data = {}

        # Determine start date based on period
        if period == Period.DAY:
            start_date = end_date - timedelta(days=30)  # Last 30 days
        elif period == Period.WEEK:
            start_date = end_date - timedelta(weeks=12)  # Last 12 weeks
        elif period == Period.MONTH:
            start_date = end_date - timedelta(days=365)  # Last year
        else:
            start_date = end_date - timedelta(days=365)

        # Initialize all periods in range
        current = start_date
        while current <= end_date:
            period_key = ProgressCalculator._get_period_key(current, period)
            period_data[period_key] = {"total": 0, "count": 0, "date": current}

            # Move to next period
            if period == Period.DAY:
                current += timedelta(days=1)
            elif period == Period.WEEK:
                current += timedelta(weeks=1)
            elif period == Period.MONTH:
                # Move to first day of next month
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1, day=1)
                else:
                    current = current.replace(month=current.month + 1, day=1)
            else:
                current += timedelta(days=1)

        # Aggregate activities into periods
        for activity in activities:
            if activity.activity_type != ActivityType.PROGRESS:
                continue

            period_key = ProgressCalculator._get_period_key(activity.activity_date, period)
            if period_key in period_data:
                period_data[period_key]["total"] += activity.value
                period_data[period_key]["count"] += 1

        return period_data

    @staticmethod
    def _get_period_key(date: datetime, period: Period) -> str:
        """Get the period key for a given date."""
        if period == Period.DAY:
            return date.strftime("%Y-%m-%d")
        elif period == Period.WEEK:
            # ISO week
            return date.strftime("%Y-W%V")
        elif period == Period.MONTH:
            return date.strftime("%Y-%m")
        elif period == Period.QUARTER:
            quarter = (date.month - 1) // 3 + 1
            return f"{date.year}-Q{quarter}"
        elif period == Period.YEAR:
            return str(date.year)
        else:
            return date.strftime("%Y-%m-%d")

    @staticmethod
    def _get_current_period_key(date: datetime, period: Period) -> str:
        """Get the current period key."""
        return ProgressCalculator._get_period_key(date, period)

    @staticmethod
    def _calculate_trend(period_history: List[PeriodHistory]) -> TrendDirection:
        """Calculate trend based on recent period history using a simple
        linear regression over the last few values."""

        if len(period_history) < 2:
            return TrendDirection.STABLE

        recent = period_history[-5:]
        values = [p.value for p in recent]
        n = len(values)
        x_vals = list(range(n))
        avg_x = sum(x_vals) / n
        avg_y = sum(values) / n
        numerator = sum((x - avg_x) * (y - avg_y) for x, y in zip(x_vals, values))
        denominator = sum((x - avg_x) ** 2 for x in x_vals) or 1
        slope = numerator / denominator

        threshold = abs(avg_y) * 0.01

        if slope > threshold:
            return TrendDirection.IMPROVING
        if slope < -threshold:
            return TrendDirection.DECLINING
        return TrendDirection.STABLE

    @staticmethod
    def _calculate_value_trend(activities: List[GoalActivity]) -> TrendDirection:
        """Calculate trend based on activity values using slope analysis."""
        if len(activities) < 2:
            return TrendDirection.STABLE

        sorted_activities = sorted(activities, key=lambda a: a.activity_date)
        values = [a.value for a in sorted_activities[-5:]]
        n = len(values)
        x_vals = list(range(n))
        avg_x = sum(x_vals) / n
        avg_y = sum(values) / n
        numerator = sum((x - avg_x) * (y - avg_y) for x, y in zip(x_vals, values))
        denominator = sum((x - avg_x) ** 2 for x in x_vals) or 1
        slope = numerator / denominator

        threshold = abs(avg_y) * 0.01

        if slope > threshold:
            return TrendDirection.IMPROVING
        if slope < -threshold:
            return TrendDirection.DECLINING
        return TrendDirection.STABLE


class DateHelper:
    """Date manipulation utilities for goals."""

    @staticmethod
    def get_period_boundaries(date: datetime, period: Period) -> Tuple[datetime, datetime]:
        """Get start and end dates for a period containing the given date."""
        if period == Period.DAY:
            start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1) - timedelta(microseconds=1)

        elif period == Period.WEEK:
            # Start on Monday
            days_since_monday = date.weekday()
            start = date - timedelta(days=days_since_monday)
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=7) - timedelta(microseconds=1)

        elif period == Period.MONTH:
            start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Get last day of month
            last_day = calendar.monthrange(date.year, date.month)[1]
            end = date.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)

        elif period == Period.QUARTER:
            quarter = (date.month - 1) // 3
            start_month = quarter * 3 + 1
            start = date.replace(
                month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0
            )

            end_month = start_month + 2
            if end_month > 12:
                end_year = date.year + 1
                end_month = end_month - 12
            else:
                end_year = date.year

            last_day = calendar.monthrange(end_year, end_month)[1]
            end = datetime(end_year, end_month, last_day, 23, 59, 59, 999999)

        elif period == Period.YEAR:
            start = date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = date.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)

        else:
            # Default to day
            start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1) - timedelta(microseconds=1)

        return start, end

    @staticmethod
    def get_periods_in_range(
        start_date: datetime, end_date: datetime, period: Period
    ) -> List[Tuple[datetime, datetime]]:
        """Get all period boundaries between two dates."""
        periods = []
        current = start_date

        while current <= end_date:
            period_start, period_end = DateHelper.get_period_boundaries(current, period)

            # Only include if period overlaps with our range
            if period_end >= start_date and period_start <= end_date:
                # Clip to our range
                clipped_start = max(period_start, start_date)
                clipped_end = min(period_end, end_date)
                periods.append((clipped_start, clipped_end))

            # Move to next period
            if period == Period.DAY:
                current = period_end + timedelta(microseconds=1)
            elif period == Period.WEEK:
                current = period_end + timedelta(microseconds=1)
            elif period == Period.MONTH:
                current = period_end + timedelta(microseconds=1)
            elif period == Period.QUARTER:
                current = period_end + timedelta(microseconds=1)
            elif period == Period.YEAR:
                current = period_end + timedelta(microseconds=1)
            else:
                break

        return periods


class GoalValidator:
    """Validation utilities for goals."""

    @staticmethod
    def validate_goal_pattern_configuration(goal: Goal) -> List[str]:
        """Validate that a goal is properly configured for its pattern."""
        errors = []

        # Validate based on pattern
        if goal.goal_pattern == GoalPattern.RECURRING:
            if not goal.target.period:
                errors.append("Recurring goals must have a period defined")
            if goal.target.target_date:
                errors.append("Recurring goals should not have a target date")

        elif goal.goal_pattern == GoalPattern.MILESTONE:
            if not goal.target.target_date:
                errors.append("Milestone goals must have a target date")
            if goal.target.period:
                errors.append("Milestone goals should not have a period")

        elif goal.goal_pattern == GoalPattern.TARGET:
            if not goal.target.target_date:
                errors.append("Target goals must have a target date")
            if goal.target.start_value is None:
                errors.append("Target goals must have a starting value")

        elif goal.goal_pattern == GoalPattern.STREAK:
            if not goal.target.period:
                errors.append("Streak goals must have a period defined")
            if goal.target.value <= 0:
                errors.append("Streak target must be positive")

        elif goal.goal_pattern == GoalPattern.LIMIT:
            if not goal.target.period:
                errors.append("Limit goals must have a period defined")

        return errors

    @staticmethod
    def validate_activity_for_goal(activity: GoalActivity, goal: Goal) -> List[str]:
        """Validate that an activity is appropriate for its goal."""
        errors = []

        # Check unit consistency
        if activity.unit and activity.unit != goal.target.unit:
            errors.append(
                f"Activity unit '{activity.unit}' does not match goal unit '{goal.target.unit}'"
            )

        # Check value constraints based on goal pattern
        if goal.goal_pattern == GoalPattern.STREAK:
            if activity.value != 1:
                errors.append("Streak activities should have a value of 1")

        # Check date constraints
        if goal.target.target_date and activity.activity_date > goal.target.target_date:
            errors.append("Activity date is after goal target date")

        return errors
