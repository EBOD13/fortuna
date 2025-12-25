# backend/app/core/exceptions.py
"""
Custom exceptions for Fortuna application
"""

from typing import Optional, Any


class FortunaException(Exception):
    """Base exception for all Fortuna errors"""
    def __init__(self, message: str, details: Optional[Any] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class NotFoundError(FortunaException):
    """Raised when a requested resource is not found"""
    pass


class ValidationError(FortunaException):
    """Raised when input validation fails"""
    pass


class AuthenticationError(FortunaException):
    """Raised when authentication fails"""
    pass


class AuthorizationError(FortunaException):
    """Raised when user doesn't have permission"""
    pass


class DuplicateError(FortunaException):
    """Raised when trying to create a duplicate resource"""
    pass


class InsufficientFundsError(FortunaException):
    """Raised when there aren't enough funds for an operation"""
    pass


class GoalError(FortunaException):
    """Base exception for goal-related errors"""
    pass


class GoalCompletedError(GoalError):
    """Raised when trying to modify a completed goal"""
    pass


class MilestoneError(FortunaException):
    """Base exception for milestone-related errors"""
    pass


class BudgetError(FortunaException):
    """Base exception for budget-related errors"""
    pass


class AIModelError(FortunaException):
    """Raised when AI model prediction fails"""
    pass