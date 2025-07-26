"""
Service layer for goal update business logic.
"""

from datetime import datetime
from typing import Any, Dict

from aws_lambda_powertools import Logger

from goals_common import (
    Goal,
    GoalAlreadyCompletedError,
    GoalError,
    GoalNotFoundError,
    GoalPattern,
    GoalPermissionError,
    GoalsRepository,
    GoalStatus,
    GoalValidationError,
    GoalValidator,
    UpdateGoalRequest,
)

logger = Logger()


class UpdateGoalService:
    """Handles goal update business logic."""

    def __init__(self):
        self.repository = GoalsRepository()

    def update_goal(self, user_id: str, goal_id: str, request: UpdateGoalRequest) -> Goal:
        """
        Update an existing goal.

        Args:
            user_id: User's unique identifier
            goal_id: Goal's unique identifier
            request: Update request data

        Returns:
            Updated goal

        Raises:
            GoalNotFoundError: If goal doesn't exist
            GoalPermissionError: If user doesn't own the goal
            GoalAlreadyCompletedError: If goal is completed or archived
            GoalValidationError: If update data is invalid
        """
        # Get existing goal
        existing_goal = self.repository.get_goal(user_id, goal_id)

        if not existing_goal:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise GoalNotFoundError(goal_id, user_id)

        # Verify ownership
        if existing_goal.user_id != user_id:
            logger.warning(
                f"User {user_id} attempted to update goal {goal_id} owned by {existing_goal.user_id}"
            )
            raise GoalPermissionError("update", goal_id)

        # Check if goal can be updated
        if existing_goal.status in [GoalStatus.COMPLETED, GoalStatus.ARCHIVED]:
            logger.warning(f"Attempt to update {existing_goal.status} goal {goal_id}")
            raise GoalAlreadyCompletedError(goal_id)

        # Build update dictionary
        updates = self._build_updates(existing_goal, request)

        if not updates:
            # No changes, return existing goal
            logger.info(f"No changes for goal {goal_id}")
            return existing_goal

        # Validate the updates
        self._validate_updates(existing_goal, updates)

        # Apply updates
        updated_goal = self.repository.update_goal(user_id, goal_id, updates)

        if not updated_goal:
            logger.error(f"Failed to update goal {goal_id}")
            raise GoalError("Failed to update goal")

        logger.info(f"Updated goal {goal_id} for user {user_id}")

        return updated_goal

    def _build_updates(self, existing_goal: Goal, request: UpdateGoalRequest) -> Dict[str, Any]:
        """
        Build dictionary of fields to update.

        Args:
            existing_goal: Current goal state
            request: Update request

        Returns:
            Dictionary of fields to update
        """
        updates = {}

        # Simple fields
        if request.title is not None and request.title != existing_goal.title:
            updates["title"] = request.title

        if request.description is not None and request.description != existing_goal.description:
            updates["description"] = request.description

        if request.category is not None and request.category != existing_goal.category:
            updates["category"] = request.category

        if request.icon is not None and request.icon != existing_goal.icon:
            updates["icon"] = request.icon

        if request.color is not None and request.color != existing_goal.color:
            updates["color"] = request.color

        # Complex fields - convert to dict for comparison
        if request.target is not None:
            # Update specific target fields
            target_dict = existing_goal.target.model_dump()
            if request.target.value is not None:
                target_dict["value"] = request.target.value
            if request.target.target_date is not None:
                target_dict["target_date"] = request.target.target_date
            if request.target.current_value is not None:
                target_dict["current_value"] = request.target.current_value
            if request.target.min_value is not None:
                target_dict["min_value"] = request.target.min_value
            if request.target.max_value is not None:
                target_dict["max_value"] = request.target.max_value
            updates["target"] = target_dict

        if request.schedule is not None:
            updates["schedule"] = request.schedule.model_dump()

        if request.context is not None:
            updates["context"] = request.context.model_dump()

        if request.rewards is not None:
            updates["rewards"] = request.rewards.model_dump()

        # Status changes
        if request.status is not None and request.status != existing_goal.status:
            updates["status"] = request.status.value

        if request.visibility is not None and request.visibility != existing_goal.visibility:
            updates["visibility"] = request.visibility.value

        if request.metadata is not None:
            updates["metadata"] = request.metadata

        return updates

    def _validate_updates(self, existing_goal: Goal, updates: Dict[str, Any]) -> None:
        """
        Validate that updates are allowed.

        Args:
            existing_goal: Current goal state
            updates: Proposed updates

        Raises:
            GoalValidationError: If updates are invalid
        """
        errors = []

        # Cannot change goal pattern
        if "goalPattern" in updates:
            errors.append("Goal pattern cannot be changed after creation")

        # Status transitions
        if "status" in updates:
            new_status = updates["status"]
            # Can only transition between active and paused
            if new_status not in ["active", "paused"]:
                errors.append(f"Cannot change status to {new_status}")

        # Target date validation for milestone/target goals
        if "target" in updates and "target_date" in updates["target"]:
            if existing_goal.goal_pattern in [GoalPattern.MILESTONE, GoalPattern.TARGET]:
                target_date = updates["target"]["target_date"]
                if isinstance(target_date, str):
                    target_date = datetime.fromisoformat(target_date.replace("Z", "+00:00"))
                if target_date < datetime.utcnow():
                    errors.append("Target date cannot be in the past")

        # Category validation removed - contract allows any string value

        if errors:
            raise GoalValidationError(errors)
