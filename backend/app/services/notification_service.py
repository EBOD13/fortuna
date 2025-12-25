# backend/app/services/notification_service.py
"""
Notification Service
Business logic for notifications, reminders, and achievements
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import date, datetime, time, timedelta

from app.models.notification import (
    Notification, Reminder, NotificationPreference,
    Achievement, UserAchievement
)
from app.models.expense import DailyCheckin, SpendingStreak
from app.models.goal import FinancialGoal
from app.schemas.notification import (
    NotificationCreate, NotificationUpdate,
    ReminderCreate, ReminderUpdate, SnoozeReminderRequest,
    NotificationPreferenceUpdate
)
from app.core.exceptions import NotFoundError, ValidationError


class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # NOTIFICATIONS
    # ============================================
    
    def create_notification(
        self,
        user_id: UUID,
        data: NotificationCreate
    ) -> Notification:
        """Create a notification"""
        notification = Notification(
            user_id=user_id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type,
            priority=data.priority,
            category=data.category,
            action_type=data.action_type,
            action_data=data.action_data,
            scheduled_for=data.scheduled_for,
            expires_at=data.expires_at,
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        return notification
    
    def get_notifications(
        self,
        user_id: UUID,
        unread_only: bool = False,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Notification], int, int]:
        """
        Get notifications for a user.
        Returns: (notifications, total_count, unread_count)
        """
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_dismissed == False,
            or_(
                Notification.expires_at == None,
                Notification.expires_at > datetime.utcnow()
            )
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        if category:
            query = query.filter(Notification.category == category)
        
        total = query.count()
        
        unread = self.db.query(func.count(Notification.notification_id)).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
            Notification.is_dismissed == False
        ).scalar()
        
        notifications = query.order_by(
            Notification.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return notifications, total, unread
    
    def mark_read(self, user_id: UUID, notification_id: UUID) -> Notification:
        """Mark a notification as read"""
        notification = self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            raise NotFoundError("Notification not found")
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(notification)
        
        return notification
    
    def mark_all_read(self, user_id: UUID) -> int:
        """Mark all notifications as read"""
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        self.db.commit()
        return count
    
    def dismiss_notification(self, user_id: UUID, notification_id: UUID) -> None:
        """Dismiss a notification"""
        notification = self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            raise NotFoundError("Notification not found")
        
        notification.is_dismissed = True
        self.db.commit()
    
    def clear_old_notifications(self, days: int = 30) -> int:
        """Delete notifications older than X days"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        count = self.db.query(Notification).filter(
            Notification.created_at < cutoff,
            Notification.is_read == True
        ).delete()
        
        self.db.commit()
        return count
    
    # ============================================
    # NOTIFICATION TRIGGERS
    # ============================================
    
    def notify_budget_alert(
        self,
        user_id: UUID,
        budget_name: str,
        spent_percentage: float,
        budget_id: UUID
    ) -> Notification:
        """Create budget alert notification"""
        return self.create_notification(
            user_id=user_id,
            data=NotificationCreate(
                title="Budget Alert 💰",
                message=f"You've spent {spent_percentage:.0f}% of your {budget_name} budget",
                notification_type="budget_alert",
                priority="high",
                category="budget",
                action_type="open_budget",
                action_data={"budget_id": str(budget_id)},
            )
        )
    
    def notify_goal_milestone(
        self,
        user_id: UUID,
        goal_name: str,
        milestone: str,
        goal_id: UUID
    ) -> Notification:
        """Create goal milestone notification"""
        return self.create_notification(
            user_id=user_id,
            data=NotificationCreate(
                title="Goal Milestone! 🎯",
                message=f"You've reached a milestone on '{goal_name}': {milestone}",
                notification_type="goal_milestone",
                priority="normal",
                category="goal",
                action_type="open_goal",
                action_data={"goal_id": str(goal_id)},
            )
        )
    
    def notify_spending_anomaly(
        self,
        user_id: UUID,
        amount: float,
        reason: str
    ) -> Notification:
        """Create spending anomaly notification"""
        return self.create_notification(
            user_id=user_id,
            data=NotificationCreate(
                title="Unusual Spending Detected 👀",
                message=f"${amount:.2f} - {reason}",
                notification_type="spending_anomaly",
                priority="normal",
                category="expense",
                action_type="view_insight",
            )
        )
    
    def notify_daily_reminder(self, user_id: UUID) -> Notification:
        """Create daily check-in reminder"""
        return self.create_notification(
            user_id=user_id,
            data=NotificationCreate(
                title="Daily Check-in 📝",
                message="Don't forget to log your expenses and emotions today!",
                notification_type="daily_reminder",
                priority="normal",
                category="reminder",
                action_type="log_expense",
            )
        )
    
    def notify_achievement(
        self,
        user_id: UUID,
        achievement_name: str,
        achievement_icon: str
    ) -> Notification:
        """Create achievement notification"""
        return self.create_notification(
            user_id=user_id,
            data=NotificationCreate(
                title=f"Achievement Unlocked! {achievement_icon}",
                message=f"You earned: {achievement_name}",
                notification_type="achievement",
                priority="normal",
                category="achievement",
            )
        )
    
    # ============================================
    # REMINDERS
    # ============================================
    
    def create_reminder(self, user_id: UUID, data: ReminderCreate) -> Reminder:
        """Create a reminder"""
        reminder = Reminder(
            user_id=user_id,
            reminder_type=data.reminder_type,
            title=data.title,
            message=data.message,
            frequency=data.frequency,
            time_of_day=data.time_of_day,
            days_of_week=data.days_of_week,
            day_of_month=data.day_of_month,
            linked_entity_type=data.linked_entity_type,
            linked_entity_id=data.linked_entity_id,
        )
        
        # Calculate next scheduled time
        reminder.next_scheduled_at = self._calculate_next_reminder_time(reminder)
        
        self.db.add(reminder)
        self.db.commit()
        self.db.refresh(reminder)
        
        return reminder
    
    def get_reminders(self, user_id: UUID, active_only: bool = True) -> List[Reminder]:
        """Get all reminders for a user"""
        query = self.db.query(Reminder).filter(Reminder.user_id == user_id)
        
        if active_only:
            query = query.filter(Reminder.is_active == True)
        
        return query.order_by(Reminder.time_of_day).all()
    
    def update_reminder(
        self,
        user_id: UUID,
        reminder_id: UUID,
        data: ReminderUpdate
    ) -> Reminder:
        """Update a reminder"""
        reminder = self.db.query(Reminder).filter(
            Reminder.reminder_id == reminder_id,
            Reminder.user_id == user_id
        ).first()
        
        if not reminder:
            raise NotFoundError("Reminder not found")
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(reminder, field, value)
        
        # Recalculate next scheduled time
        reminder.next_scheduled_at = self._calculate_next_reminder_time(reminder)
        
        self.db.commit()
        self.db.refresh(reminder)
        
        return reminder
    
    def delete_reminder(self, user_id: UUID, reminder_id: UUID) -> None:
        """Delete a reminder"""
        reminder = self.db.query(Reminder).filter(
            Reminder.reminder_id == reminder_id,
            Reminder.user_id == user_id
        ).first()
        
        if not reminder:
            raise NotFoundError("Reminder not found")
        
        self.db.delete(reminder)
        self.db.commit()
    
    def snooze_reminder(
        self,
        user_id: UUID,
        reminder_id: UUID,
        data: SnoozeReminderRequest
    ) -> Reminder:
        """Snooze a reminder"""
        reminder = self.db.query(Reminder).filter(
            Reminder.reminder_id == reminder_id,
            Reminder.user_id == user_id
        ).first()
        
        if not reminder:
            raise NotFoundError("Reminder not found")
        
        reminder.is_snoozed = True
        reminder.snoozed_until = data.snooze_until
        
        self.db.commit()
        self.db.refresh(reminder)
        
        return reminder
    
    def _calculate_next_reminder_time(self, reminder: Reminder) -> datetime:
        """Calculate the next time a reminder should trigger"""
        now = datetime.utcnow()
        today = now.date()
        reminder_time = reminder.time_of_day
        
        if reminder.frequency == 'daily':
            next_date = today
            next_dt = datetime.combine(next_date, reminder_time)
            if next_dt <= now:
                next_dt += timedelta(days=1)
            return next_dt
        
        elif reminder.frequency == 'weekly':
            if not reminder.days_of_week:
                return datetime.combine(today + timedelta(days=1), reminder_time)
            
            # Find next matching day
            for i in range(7):
                check_date = today + timedelta(days=i)
                if check_date.weekday() in reminder.days_of_week:
                    next_dt = datetime.combine(check_date, reminder_time)
                    if next_dt > now:
                        return next_dt
            
            # Wrap to next week
            for i in range(7, 14):
                check_date = today + timedelta(days=i)
                if check_date.weekday() in reminder.days_of_week:
                    return datetime.combine(check_date, reminder_time)
        
        elif reminder.frequency == 'monthly':
            if not reminder.day_of_month:
                return datetime.combine(today + timedelta(days=1), reminder_time)
            
            # This month or next
            try:
                next_date = today.replace(day=reminder.day_of_month)
            except ValueError:
                # Day doesn't exist in this month
                next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
                next_date = next_month.replace(day=min(reminder.day_of_month, 28))
            
            next_dt = datetime.combine(next_date, reminder_time)
            if next_dt <= now:
                # Next month
                next_month = (next_date.replace(day=1) + timedelta(days=32)).replace(day=1)
                next_date = next_month.replace(day=min(reminder.day_of_month, 28))
                next_dt = datetime.combine(next_date, reminder_time)
            
            return next_dt
        
        return datetime.combine(today + timedelta(days=1), reminder_time)
    
    def get_due_reminders(self) -> List[Reminder]:
        """Get all reminders that are due now (for background job)"""
        now = datetime.utcnow()
        
        return self.db.query(Reminder).filter(
            Reminder.is_active == True,
            Reminder.next_scheduled_at <= now,
            or_(
                Reminder.is_snoozed == False,
                Reminder.snoozed_until <= now
            )
        ).all()
    
    def process_reminder(self, reminder: Reminder) -> Notification:
        """Process a due reminder and create notification"""
        # Create notification
        notification = self.create_notification(
            user_id=reminder.user_id,
            data=NotificationCreate(
                title=reminder.title,
                message=reminder.message or f"Reminder: {reminder.title}",
                notification_type="daily_reminder",
                priority="normal",
                category="reminder",
            )
        )
        
        # Update reminder
        reminder.last_sent_at = datetime.utcnow()
        reminder.next_scheduled_at = self._calculate_next_reminder_time(reminder)
        reminder.is_snoozed = False
        reminder.snoozed_until = None
        
        self.db.commit()
        
        return notification
    
    # ============================================
    # PREFERENCES
    # ============================================
    
    def get_preferences(self, user_id: UUID) -> NotificationPreference:
        """Get or create notification preferences"""
        prefs = self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        
        if not prefs:
            prefs = NotificationPreference(user_id=user_id)
            self.db.add(prefs)
            self.db.commit()
            self.db.refresh(prefs)
        
        return prefs
    
    def update_preferences(
        self,
        user_id: UUID,
        data: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        """Update notification preferences"""
        prefs = self.get_preferences(user_id)
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(prefs, field, value)
        
        self.db.commit()
        self.db.refresh(prefs)
        
        return prefs
    
    def should_send_notification(
        self,
        user_id: UUID,
        notification_type: str
    ) -> bool:
        """Check if user should receive this type of notification"""
        prefs = self.get_preferences(user_id)
        
        if not prefs.push_enabled:
            return False
        
        # Check quiet hours
        if prefs.quiet_hours_enabled:
            now = datetime.utcnow().time()
            if prefs.quiet_hours_start and prefs.quiet_hours_end:
                if prefs.quiet_hours_start <= now or now <= prefs.quiet_hours_end:
                    return False
        
        # Check notification type preferences
        type_map = {
            'budget_alert': prefs.budget_alerts,
            'goal_milestone': prefs.goal_updates,
            'spending_anomaly': prefs.spending_anomalies,
            'daily_reminder': prefs.daily_reminders,
            'weekly_summary': prefs.weekly_summaries,
            'bill_reminder': prefs.bill_reminders,
            'emotional_insight': prefs.emotional_insights,
            'achievement': prefs.achievements,
        }
        
        return type_map.get(notification_type, True)
    
    # ============================================
    # ACHIEVEMENTS
    # ============================================
    
    def check_achievements(self, user_id: UUID) -> List[UserAchievement]:
        """Check and award any earned achievements"""
        earned = []
        
        achievements = self.db.query(Achievement).filter(
            Achievement.is_active == True
        ).all()
        
        for achievement in achievements:
            # Check if already earned
            existing = self.db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.achievement_id,
                UserAchievement.current_progress >= achievement.requirement_value
            ).first()
            
            if existing:
                continue
            
            # Check progress
            progress = self._get_achievement_progress(user_id, achievement)
            
            # Update or create user achievement
            user_achievement = self.db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.achievement_id
            ).first()
            
            if not user_achievement:
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.achievement_id,
                    target_progress=achievement.requirement_value,
                )
                self.db.add(user_achievement)
            
            user_achievement.current_progress = progress
            
            # Check if just earned
            if progress >= achievement.requirement_value and not user_achievement.notification_sent:
                user_achievement.earned_at = datetime.utcnow()
                user_achievement.notification_sent = True
                
                # Create notification
                self.notify_achievement(user_id, achievement.name, achievement.icon or "🏆")
                
                earned.append(user_achievement)
        
        self.db.commit()
        return earned
    
    def _get_achievement_progress(self, user_id: UUID, achievement: Achievement) -> int:
        """Get progress for a specific achievement"""
        req_type = achievement.requirement_type
        
        if req_type == 'streak_days':
            # Get current streak
            streak = self.db.query(SpendingStreak).filter(
                SpendingStreak.user_id == user_id,
                SpendingStreak.streak_type == 'daily_logging'
            ).first()
            return streak.current_streak if streak else 0
        
        elif req_type == 'goals_completed':
            return self.db.query(func.count(FinancialGoal.goal_id)).filter(
                FinancialGoal.user_id == user_id,
                FinancialGoal.status == 'completed'
            ).scalar() or 0
        
        elif req_type == 'emotions_logged':
            return self.db.query(func.count(DailyCheckin.checkin_id)).filter(
                DailyCheckin.user_id == user_id,
                DailyCheckin.emotions_captured == True
            ).scalar() or 0
        
        # Add more achievement types as needed
        
        return 0
    
    def get_user_achievements(self, user_id: UUID) -> List[UserAchievement]:
        """Get all earned achievements for a user"""
        return self.db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.earned_at != None
        ).order_by(UserAchievement.earned_at.desc()).all()
    
    def get_achievement_progress(self, user_id: UUID) -> List[Dict]:
        """Get progress on all achievements"""
        achievements = self.db.query(Achievement).filter(
            Achievement.is_active == True
        ).all()
        
        result = []
        for achievement in achievements:
            user_ach = self.db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.achievement_id
            ).first()
            
            progress = user_ach.current_progress if user_ach else 0
            target = achievement.requirement_value
            
            result.append({
                'achievement': achievement,
                'current_progress': progress,
                'target_progress': target,
                'progress_percentage': round(min(100, progress / target * 100), 1),
                'is_earned': progress >= target,
                'earned_at': user_ach.earned_at if user_ach else None,
            })
        
        return result
    
    def seed_achievements(self) -> List[Achievement]:
        """Seed default achievements"""
        default_achievements = [
            {
                'name': 'First Steps',
                'description': 'Log your first expense with emotion',
                'icon': '👣',
                'category': 'emotional',
                'requirement_type': 'emotions_logged',
                'requirement_value': 1,
                'points': 10,
            },
            {
                'name': 'Week Warrior',
                'description': 'Log expenses for 7 days in a row',
                'icon': '📅',
                'category': 'streak',
                'requirement_type': 'streak_days',
                'requirement_value': 7,
                'points': 25,
            },
            {
                'name': 'Month Master',
                'description': 'Log expenses for 30 days in a row',
                'icon': '🗓️',
                'category': 'streak',
                'requirement_type': 'streak_days',
                'requirement_value': 30,
                'points': 100,
            },
            {
                'name': 'Goal Getter',
                'description': 'Complete your first financial goal',
                'icon': '🎯',
                'category': 'saving',
                'requirement_type': 'goals_completed',
                'requirement_value': 1,
                'points': 50,
            },
            {
                'name': 'Triple Threat',
                'description': 'Complete 3 financial goals',
                'icon': '🏆',
                'category': 'saving',
                'requirement_type': 'goals_completed',
                'requirement_value': 3,
                'points': 150,
            },
            {
                'name': 'Emotional Explorer',
                'description': 'Log emotions with 50 expenses',
                'icon': '🧠',
                'category': 'emotional',
                'requirement_type': 'emotions_logged',
                'requirement_value': 50,
                'points': 75,
            },
        ]
        
        created = []
        for ach_data in default_achievements:
            existing = self.db.query(Achievement).filter(
                Achievement.name == ach_data['name']
            ).first()
            
            if not existing:
                achievement = Achievement(**ach_data)
                self.db.add(achievement)
                created.append(achievement)
        
        self.db.commit()
        return created