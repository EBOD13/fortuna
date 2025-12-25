# backend/app/api/v1/notifications.py
"""
Notifications API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import time

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.notification import (
    NotificationResponse, NotificationUpdate, NotificationList,
    ReminderCreate, ReminderUpdate, ReminderResponse, SnoozeReminderRequest,
    NotificationPreferenceUpdate, NotificationPreferenceResponse,
    UserAchievementResponse, AchievementProgress, AchievementSummary
)
from app.core.exceptions import NotFoundError

router = APIRouter()


# ============================================
# NOTIFICATIONS
# ============================================

@router.get("/", response_model=NotificationList)
def get_notifications(
    unread_only: bool = Query(False, description="Only show unread"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for current user"""
    service = NotificationService(db)
    
    offset = (page - 1) * per_page
    notifications, total, unread = service.get_notifications(
        current_user.user_id,
        unread_only=unread_only,
        category=category,
        limit=per_page,
        offset=offset
    )
    
    return NotificationList(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread,
        page=page,
        per_page=per_page
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    service = NotificationService(db)
    _, _, unread = service.get_notifications(current_user.user_id, limit=0)
    return {"unread_count": unread}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    service = NotificationService(db)
    try:
        return service.mark_read(current_user.user_id, notification_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    service = NotificationService(db)
    count = service.mark_all_read(current_user.user_id)
    return {"marked_read": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss a notification"""
    service = NotificationService(db)
    try:
        service.dismiss_notification(current_user.user_id, notification_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Notification not found")


# ============================================
# REMINDERS
# ============================================

@router.post("/reminders", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new reminder"""
    service = NotificationService(db)
    return service.create_reminder(current_user.user_id, data)


@router.get("/reminders", response_model=List[ReminderResponse])
def get_reminders(
    active_only: bool = Query(True, description="Only show active reminders"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reminders"""
    service = NotificationService(db)
    return service.get_reminders(current_user.user_id, active_only=active_only)


@router.put("/reminders/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: UUID,
    data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a reminder"""
    service = NotificationService(db)
    try:
        return service.update_reminder(current_user.user_id, reminder_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Reminder not found")


@router.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reminder"""
    service = NotificationService(db)
    try:
        service.delete_reminder(current_user.user_id, reminder_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Reminder not found")


@router.post("/reminders/{reminder_id}/snooze", response_model=ReminderResponse)
def snooze_reminder(
    reminder_id: UUID,
    data: SnoozeReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Snooze a reminder"""
    service = NotificationService(db)
    try:
        return service.snooze_reminder(current_user.user_id, reminder_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Reminder not found")


# ============================================
# PREFERENCES
# ============================================

@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification preferences"""
    service = NotificationService(db)
    return service.get_preferences(current_user.user_id)


@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_preferences(
    data: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notification preferences"""
    service = NotificationService(db)
    return service.update_preferences(current_user.user_id, data)


# ============================================
# ACHIEVEMENTS
# ============================================

@router.get("/achievements", response_model=List[UserAchievementResponse])
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all earned achievements"""
    service = NotificationService(db)
    return service.get_user_achievements(current_user.user_id)


@router.get("/achievements/progress")
def get_achievement_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get progress on all achievements"""
    service = NotificationService(db)
    return service.get_achievement_progress(current_user.user_id)


@router.post("/achievements/check")
def check_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check and award any earned achievements"""
    service = NotificationService(db)
    earned = service.check_achievements(current_user.user_id)
    return {
        "checked": True,
        "newly_earned": len(earned),
        "achievements": [
            {
                "name": a.achievement.name,
                "icon": a.achievement.icon,
                "points": a.achievement.points,
            }
            for a in earned
        ]
    }


@router.post("/achievements/seed", status_code=status.HTTP_201_CREATED)
def seed_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Seed default achievements (admin use)"""
    service = NotificationService(db)
    created = service.seed_achievements()
    return {"created": len(created)}