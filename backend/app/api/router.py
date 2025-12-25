# backend/app/api/router.py
"""
Main API Router
Aggregates all API endpoint routers
"""

from fastapi import APIRouter
from app.api.v1 import (
    auth, goals, recurring_expenses, dependents, 
    income, expenses, insights, budget, notifications, dashboard
)

api_router = APIRouter()

# Auth (public endpoints)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Protected endpoints (require JWT token)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(income.router, prefix="/income", tags=["Income"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(budget.router, prefix="/budget", tags=["Budget"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
api_router.include_router(recurring_expenses.router, prefix="/recurring-expenses", tags=["Recurring Expenses"])
api_router.include_router(dependents.router, prefix="/dependents", tags=["Dependents"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(insights.router, prefix="/insights", tags=["AI Insights"])ß