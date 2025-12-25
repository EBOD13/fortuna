# backend/app/models/__init__.py
"""
SQLAlchemy Models
Export all models for easy importing
"""

from app.models.user import User
from app.models.goal import (
    FinancialGoal,
    GoalMilestone,
    GoalProgressHistory,
    GoalCategory
)
from app.models.recurring_expense import (
    RecurringExpense,
    RecurringExpenseHistory,
    UpcomingBill
)
from app.models.dependent import (
    Dependent,
    DependentExpenseType,
    DependentExpense,
    DependentSharedCost,
    DependentMonthlySummary
)
from app.models.income import (
    IncomeSource,
    IncomeHistory,
    TaxBracket
)
from app.models.expense import (
    ExpenseCategory,
    Expense,
    ExpenseEmotion,
    DailyCheckin,
    SpendingStreak,
    MonthlyEmotionalAnalysis
)
from app.models.budget import (
    Budget,
    CategoryBudget,
    BudgetHistory,
    BudgetTemplate
)
from app.models.notification import (
    Notification,
    Reminder,
    NotificationPreference,
    Achievement,
    UserAchievement
)

__all__ = [
    # User
    "User",
    
    # Goals
    "FinancialGoal",
    "GoalMilestone",
    "GoalProgressHistory",
    "GoalCategory",
    
    # Recurring Expenses
    "RecurringExpense",
    "RecurringExpenseHistory",
    "UpcomingBill",
    
    # Dependents
    "Dependent",
    "DependentExpenseType",
    "DependentExpense",
    "DependentSharedCost",
    "DependentMonthlySummary",
    
    # Income
    "IncomeSource",
    "IncomeHistory",
    "TaxBracket",
    
    # Expenses
    "ExpenseCategory",
    "Expense",
    "ExpenseEmotion",
    "DailyCheckin",
    "SpendingStreak",
    "MonthlyEmotionalAnalysis",
    
    # Budget
    "Budget",
    "CategoryBudget",
    "BudgetHistory",
    "BudgetTemplate",
    
    # Notifications
    "Notification",
    "Reminder",
    "NotificationPreference",
    "Achievement",
    "UserAchievement",
]