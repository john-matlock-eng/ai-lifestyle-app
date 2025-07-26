"""Repository layer for habit tracking - handles all DynamoDB operations."""

import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError

from .errors import HabitConflictError, HabitNotFoundError
from .models import HabitAnalyticsResponse, HabitCheckInResponse, HabitResponse, UserStatsResponse

logger = logging.getLogger(__name__)


class HabitRepository:
    """Repository for habit-related DynamoDB operations."""

    def __init__(self, table_name: str):
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def _get_habit_key(self, user_id: str, habit_id: str) -> Dict[str, str]:
        """Generate the primary key for a habit."""
        return {"pk": f"USER#{user_id}", "sk": f"HABIT#{habit_id}"}

    def _get_checkin_key(self, user_id: str, habit_id: str, check_date: date) -> Dict[str, str]:
        """Generate the primary key for a habit check-in."""
        return {"pk": f"USER#{user_id}#HABIT#{habit_id}",
            "sk": f"CHECKIN#{check_date.isoformat()}"}

    def _get_stats_key(self, user_id: str) -> Dict[str, str]:
        """Generate the primary key for user stats."""
        return {"pk": f"USER#{user_id}", "sk": "STATS#HABITS"}

    def create_habit(
        self, user_id: str, habit_id: str, habit_data: Dict[str, Any]
    ) -> HabitResponse:
        """Create a new habit in DynamoDB."""
        try:
            now = datetime.utcnow()

            # Initialize week progress (7 days of False)
            week_progress = [False] * 7

            item = {
                **self._get_habit_key(user_id, habit_id),
                "id": habit_id,
                "userId": user_id,
                "title": habit_data["title"],
                "description": habit_data.get("description"),
                "category": habit_data.get("category", "other"),
                "icon": habit_data.get("icon", "📌"),
                "color": habit_data.get("color", "#3B82F6"),
                "pattern": habit_data.get("pattern", "daily"),
                "targetDays": habit_data.get("target_days", 30),
                "motivationalText": habit_data.get("motivational_text"),
                "reminderTime": habit_data.get("reminder_time"),
                "goalId": habit_data.get("goal_id"),
                "showOnDashboard": habit_data.get("show_on_dashboard", True),
                "displayOrder": habit_data.get("display_order", 0),
                "currentStreak": 0,
                "longestStreak": 0,
                "lastCompleted": None,
                "completedToday": False,
                "skippedToday": False,
                "weekProgress": week_progress,
                "points": 0,
                "bonusMultiplier": Decimal("1.0"),
                "createdAt": now.isoformat(),
                "updatedAt": now.isoformat(),
                "entityType": "HABIT",
            }

            # Remove None values
            item = {k: v for k, v in item.items() if v is not None}

            self.table.put_item(Item=item, ConditionExpression="attribute_not_exists(pk)")

            # Update user's total habits count
            self._increment_user_stat(user_id, "totalHabits", 1)

            return self._item_to_habit_response(item)

        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise HabitConflictError(f"Habit {habit_id} already exists")
            logger.error(f"Failed to create habit: {str(e)}")
            raise

    def get_habit(self, user_id: str, habit_id: str) -> HabitResponse:
        """Get a single habit by ID."""
        try:
            response = self.table.get_item(Key=self._get_habit_key(user_id, habit_id))

            if "Item" not in response:
                raise HabitNotFoundError(f"Habit {habit_id} not found")

            return self._item_to_habit_response(response["Item"])

        except ClientError as e:
            logger.error(f"Failed to get habit: {str(e)}")
            raise

    def list_habits(self, user_id: str, show_dashboard_only: bool = False) -> List[HabitResponse]:
        """List all habits for a user."""
        try:
            response = self.table.query(
                KeyConditionExpression=Key("pk").eq(f"USER#{user_id}")
                & Key("sk").begins_with("HABIT#")
            )

            habits = []
            for item in response.get("Items", []):
                if show_dashboard_only and not item.get("showOnDashboard", True):
                    continue
                habits.append(self._item_to_habit_response(item))

            # Sort by display order
            habits.sort(key=lambda h: h.display_order)

            return habits

        except ClientError as e:
            logger.error(f"Failed to list habits: {str(e)}")
            raise

    def get_today_habits(self, user_id: str) -> List[HabitResponse]:
        """Get habits with today's completion status."""
        habits = self.list_habits(user_id, show_dashboard_only=True)
        today = date.today()

        # Check today's completion status for each habit
        for habit in habits:
            check_in = self.get_habit_checkin(user_id, habit.id, today)
            if check_in:
                habit.completed_today = check_in.completed
                habit.skipped_today = check_in.skipped

            # Update week progress
            habit.week_progress = self._get_week_progress(user_id, habit.id)

        return habits

    def update_habit(self, user_id: str, habit_id: str, updates: Dict[str, Any]) -> HabitResponse:
        """Update a habit."""
        try:
            # Build update expression
            update_expr_parts = []
            expr_attr_names = {}
            expr_attr_values = {}

            # Map of field names to DynamoDB attribute names
            field_mapping = {
                "title": "title",
                "description": "description",
                "category": "category",
                "icon": "icon",
                "color": "color",
                "target_days": "targetDays",
                "motivational_text": "motivationalText",
                "reminder_time": "reminderTime",
                "show_on_dashboard": "showOnDashboard",
                "display_order": "displayOrder",
            }

            for field, db_field in field_mapping.items():
                if field in updates and updates[field] is not None:
                    update_expr_parts.append(f"#{field} = :{field}")
                    expr_attr_names[f"#{field}"] = db_field
                    expr_attr_values[f":{field}"] = updates[field]

            if not update_expr_parts:
                # No updates to perform
                return self.get_habit(user_id, habit_id)

            # Always update the updatedAt timestamp
            update_expr_parts.append("#updatedAt = :updatedAt")
            expr_attr_names["#updatedAt"] = "updatedAt"
            expr_attr_values[":updatedAt"] = datetime.utcnow().isoformat()

            update_expression = "SET " + ", ".join(update_expr_parts)

            response = self.table.update_item(
                Key=self._get_habit_key(user_id, habit_id),
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values,
                ConditionExpression="attribute_exists(pk)",
                ReturnValues="ALL_NEW",
            )

            return self._item_to_habit_response(response["Attributes"])

        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise HabitNotFoundError(f"Habit {habit_id} not found")
            logger.error(f"Failed to update habit: {str(e)}")
            raise

    def delete_habit(self, user_id: str, habit_id: str) -> None:
        """Delete a habit and all associated check-ins."""
        try:
            # First, delete the habit
            self.table.delete_item(
                Key=self._get_habit_key(user_id, habit_id),
                ConditionExpression="attribute_exists(pk)",
            )

            # Delete all check-ins for this habit
            checkin_response = self.table.query(
                KeyConditionExpression=Key("pk").eq(f"USER#{user_id}#HABIT#{habit_id}")
            )

            # Batch delete check-ins
            with self.table.batch_writer() as batch:
                for item in checkin_response.get("Items", []):
                    batch.delete_item(Key={"pk": item["pk"], "sk": item["sk"]})

            # Update user's total habits count
            self._increment_user_stat(user_id, "totalHabits", -1)

        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise HabitNotFoundError(f"Habit {habit_id} not found")
            logger.error(f"Failed to delete habit: {str(e)}")
            raise

    def check_in_habit(
        self,
        user_id: str,
        habit_id: str,
        check_date: date,
        completed: bool,
        note: Optional[str] = None,
        value: Optional[float] = None,
    ) -> HabitCheckInResponse:
        """Record a habit check-in."""
        try:
            # Get the habit first
            habit = self.get_habit(user_id, habit_id)

            # Calculate points and streak
            points_earned = 0
            streak_continued = False
            milestone_reached = None
            bonus_earned = False

            if completed:
                # Base points
                base_points = 10

                # Check if streak continues
                yesterday = check_date - timedelta(days=1)
                yesterday_checkin = self.get_habit_checkin(user_id, habit_id, yesterday)

                if yesterday_checkin and yesterday_checkin.completed:
                    streak_continued = True
                    new_streak = habit.current_streak + 1
                elif habit.current_streak == 0 or (
                    habit.last_completed
                    and (check_date - datetime.fromisoformat(habit.last_completed).date()).days > 1
                ):
                    # Starting new streak or broke the streak
                    new_streak = 1
                else:
                    new_streak = habit.current_streak

                # Apply multiplier
                points_earned = int(base_points * float(habit.bonus_multiplier))

                # Check for milestones (7, 14, 21, 30, 60, 90, 180, 365 days)
                milestones = [7, 14, 21, 30, 60, 90, 180, 365]
                if new_streak in milestones:
                    milestone_reached = new_streak
                    bonus_points = {
                        7: 50,
                        14: 75,
                        21: 100,
                        30: 150,
                        60: 200,
                        90: 300,
                        180: 500,
                        365: 1000,
                    }
                    points_earned += bonus_points.get(new_streak, 0)
                    bonus_earned = True

                # Update habit with new streak and last completed
                self._update_habit_streak(user_id, habit_id, new_streak, check_date)

                # Update user stats
                self._increment_user_stat(user_id, "totalCheckIns", 1)
                self._increment_user_stat(user_id, "totalPoints", points_earned)

            # Create check-in record
            checkin_item = {
                **self._get_checkin_key(user_id, habit_id, check_date),
                "habitId": habit_id,
                "date": check_date.isoformat(),
                "completed": completed,
                "skipped": not completed,
                "note": note,
                "value": Decimal(str(value)) if value is not None else None,
                "points": points_earned,
                "createdAt": datetime.utcnow().isoformat(),
                "entityType": "HABIT_CHECKIN",
            }

            # Remove None values
            checkin_item = {k: v for k, v in checkin_item.items() if v is not None}

            self.table.put_item(Item=checkin_item)

            return HabitCheckInResponse(
                habit_id=habit_id,
                date=check_date,
                completed=completed,
                skipped=not completed,
                value=value,
                note=note,
                points=points_earned,
                streak_continued=streak_continued,
                current_streak=habit.current_streak + 1 if completed else habit.current_streak,
                milestone_reached=milestone_reached,
                bonus_earned=bonus_earned,
            )

        except ClientError as e:
            logger.error(f"Failed to check in habit: {str(e)}")
            raise

    def skip_habit(self, user_id: str, habit_id: str, skip_date: date) -> None:
        """Mark a habit as skipped for a specific date."""
        self.check_in_habit(user_id, habit_id, skip_date, completed=False)

    def get_habit_checkin(
        self, user_id: str, habit_id: str, check_date: date
    ) -> Optional[HabitCheckInResponse]:
        """Get a specific check-in for a habit."""
        try:
            response = self.table.get_item(Key=self._get_checkin_key(user_id, habit_id, check_date))

            if "Item" not in response:
                return None

            item = response["Item"]
            return HabitCheckInResponse(
                habit_id=item["habitId"],
                date=date.fromisoformat(item["date"]),
                completed=item.get("completed", False),
                skipped=item.get("skipped", False),
                value=float(item["value"]) if "value" in item else None,
                note=item.get("note"),
                points=item.get("points", 0),
                streak_continued=False,  # Not stored, calculated at check-in time
                current_streak=0,  # Not stored here
            )

        except ClientError as e:
            logger.error(f"Failed to get habit check-in: {str(e)}")
            return None

    def get_user_stats(self, user_id: str) -> UserStatsResponse:
        """Get user's gamification stats."""
        try:
            response = self.table.get_item(Key=self._get_stats_key(user_id))

            if "Item" not in response:
                # Initialize stats if they don't exist
                return self._initialize_user_stats(user_id)

            item = response["Item"]

            # Calculate level and progress
            total_points = item.get("totalPoints", 0)
            current_level = (total_points // 100) + 1
            next_level_progress = total_points % 100

            # Get today's completion count
            habits_completed_today = self._count_habits_completed_today(user_id)

            return UserStatsResponse(
                total_points=total_points,
                current_level=current_level,
                next_level_progress=next_level_progress,
                weekly_streak=item.get("weeklyStreak", 0),
                perfect_days=item.get("perfectDays", 0),
                total_check_ins=item.get("totalCheckIns", 0),
                habits_completed_today=habits_completed_today,
                total_habits=item.get("totalHabits", 0),
            )

        except ClientError as e:
            logger.error(f"Failed to get user stats: {str(e)}")
            raise

    def get_habit_analytics(
        self, user_id: str, habit_id: str, period: str = "month"
    ) -> HabitAnalyticsResponse:
        """Get analytics for a specific habit."""
        try:
            # Determine date range
            end_date = date.today()
            if period == "week":
                start_date = end_date - timedelta(days=7)
            elif period == "month":
                start_date = end_date - timedelta(days=30)
            else:  # year
                start_date = end_date - timedelta(days=365)

            # Query check-ins for the period
            checkins = []
            current_date = start_date
            while current_date <= end_date:
                checkin = self.get_habit_checkin(user_id, habit_id, current_date)
                if checkin:
                    checkins.append(checkin)
                current_date += timedelta(days=1)

            # Calculate analytics
            total_days = (end_date - start_date).days + 1
            completed_days = sum(1 for c in checkins if c.completed)
            missed_days = total_days - len(checkins)
            completion_rate = (completed_days / total_days) * 100 if total_days > 0 else 0

            # Calculate average streak
            streaks = []
            current_streak = 0
            for checkin in sorted(checkins, key=lambda x: x.date):
                if checkin.completed:
                    current_streak += 1
                else:
                    if current_streak > 0:
                        streaks.append(current_streak)
                    current_streak = 0
            if current_streak > 0:
                streaks.append(current_streak)

            average_streak = sum(streaks) / len(streaks) if streaks else 0

            # Determine trend (simple comparison of first half vs second half)
            mid_point = len(checkins) // 2
            if mid_point > 0:
                first_half_rate = sum(1 for c in checkins[:mid_point] if c.completed) / mid_point
                second_half_rate = sum(1 for c in checkins[mid_point:] if c.completed) / (
                    len(checkins) - mid_point
                )

                if second_half_rate > first_half_rate * 1.1:
                    trend = "improving"
                elif second_half_rate < first_half_rate * 0.9:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "stable"

            return HabitAnalyticsResponse(
                habit_id=habit_id,
                period=period,
                completion_rate=completion_rate,
                average_streak=average_streak,
                best_time_of_day=None,  # Would require time tracking
                total_completions=completed_days,
                missed_days=missed_days,
                current_trend=trend,
                correlations=[],  # Would require cross-habit analysis
            )

        except ClientError as e:
            logger.error(f"Failed to get habit analytics: {str(e)}")
            raise

    # Helper methods

    def _item_to_habit_response(self, item: Dict[str, Any]) -> HabitResponse:
        """Convert DynamoDB item to HabitResponse."""
        return HabitResponse(
            id=item["id"],
            user_id=item["userId"],
            title=item["title"],
            description=item.get("description"),
            category=item.get("category", "other"),
            icon=item.get("icon", "📌"),
            color=item.get("color", "#3B82F6"),
            pattern=item.get("pattern", "daily"),
            target_days=item.get("targetDays", 30),
            motivational_text=item.get("motivationalText"),
            reminder_time=item.get("reminderTime"),
            goal_id=item.get("goalId"),
            current_streak=item.get("currentStreak", 0),
            longest_streak=item.get("longestStreak", 0),
            last_completed=item.get("lastCompleted"),
            completed_today=item.get("completedToday", False),
            skipped_today=item.get("skippedToday", False),
            week_progress=item.get("weekProgress", [False] * 7),
            points=item.get("points", 0),
            bonus_multiplier=float(item.get("bonusMultiplier", 1.0)),
            display_order=item.get("displayOrder", 0),
            show_on_dashboard=item.get("showOnDashboard", True),
            created_at=item["createdAt"],
            updated_at=item["updatedAt"],
        )

    def _get_week_progress(self, user_id: str, habit_id: str) -> List[bool]:
        """Get the last 7 days of progress for a habit."""
        progress = []
        today = date.today()

        # Sunday = 0, Saturday = 6
        days_since_sunday = today.weekday() + 1 if today.weekday() < 6 else 0
        sunday = today - timedelta(days=days_since_sunday)

        for i in range(7):
            check_date = sunday + timedelta(days=i)
            if check_date > today:
                progress.append(False)
            else:
                checkin = self.get_habit_checkin(user_id, habit_id, check_date)
                progress.append(checkin.completed if checkin else False)

        return progress

    def _update_habit_streak(
        self, user_id: str, habit_id: str, new_streak: int, last_completed: date
    ) -> None:
        """Update habit's streak information."""
        try:
            # Get current habit to check longest streak
            habit = self.get_habit(user_id, habit_id)
            longest_streak = max(habit.longest_streak, new_streak)

            self.table.update_item(
                Key=self._get_habit_key(user_id, habit_id),
                UpdateExpression="SET currentStreak = :streak, longestStreak = :longest, "
                + "lastCompleted = :completed, completedToday = :today, updatedAt = :updated",
                ExpressionAttributeValues={
                    ":streak": new_streak,
                    ":longest": longest_streak,
                    ":completed": last_completed.isoformat(),
                    ":today": True,
                    ":updated": datetime.utcnow().isoformat(),
                },
            )
        except ClientError as e:
            logger.error(f"Failed to update habit streak: {str(e)}")
            raise

    def _increment_user_stat(self, user_id: str, stat_name: str, increment: int) -> None:
        """Increment a user stat value."""
        try:
            self.table.update_item(
                Key=self._get_stats_key(user_id),
                UpdateExpression=f"ADD {stat_name} :inc SET updatedAt = :updated",
                ExpressionAttributeValues={
                    ":inc": increment,
                    ":updated": datetime.utcnow().isoformat(),
                },
            )
        except ClientError as e:
            logger.error(f"Failed to increment user stat {stat_name}: {str(e)}")

    def _initialize_user_stats(self, user_id: str) -> UserStatsResponse:
        """Initialize user stats if they don't exist."""
        try:
            item = {
                **self._get_stats_key(user_id),
                "totalPoints": 0,
                "weeklyStreak": 0,
                "perfectDays": 0,
                "totalCheckIns": 0,
                "totalHabits": 0,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat(),
                "entityType": "USER_STATS",
            }

            self.table.put_item(Item=item)

            return UserStatsResponse(
                total_points=0,
                current_level=1,
                next_level_progress=0,
                weekly_streak=0,
                perfect_days=0,
                total_check_ins=0,
                habits_completed_today=0,
                total_habits=0,
            )
        except ClientError as e:
            logger.error(f"Failed to initialize user stats: {str(e)}")
            raise

    def _count_habits_completed_today(self, user_id: str) -> int:
        """Count how many habits were completed today."""
        habits = self.get_today_habits(user_id)
        return sum(1 for h in habits if h.completed_today)
