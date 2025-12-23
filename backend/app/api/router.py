from fastapi import APIRouter
from app.api.v1 import auth, income, expenses, goals, recurring_expenses, dependents, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(income.router, prefix="/income", tags=["Income"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
api_router.include_router(recurring_expenses.router, prefix="/recurring-expenses", tags=["Recurring Expenses"])
api_router.include_router(dependents.router, prefix="/dependents", tags=["Dependents"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])