# backend/app/services/dependent_service.py
"""
Dependent Service
Business logic for managing financial dependents (humans, pets, shared costs)
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from app.models.dependent import (
    Dependent, DependentExpenseType, DependentExpense,
    DependentSharedCost, DependentMonthlySummary
)
from app.schemas.dependent import (
    DependentCreate, DependentUpdate,
    ExpenseTypeCreate, DependentExpenseCreate,
    SharedCostCreate, SharedCostUpdate, SharedCostPaymentRequest,
    DependentStats, DependentCostProjection,
    BrotherEducationSetup, PetSetup
)
from app.core.exceptions import NotFoundError, ValidationError


class DependentService:
    """Service for managing financial dependents"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # DEPENDENT CRUD
    # ============================================
    
    def create_dependent(
        self,
        user_id: UUID,
        data: DependentCreate
    ) -> Dependent:
        """Create a new dependent"""
        
        dependent = Dependent(
            user_id=user_id,
            dependent_name=data.dependent_name,
            relationship=data.relationship.value,
            dependent_type=data.dependent_type.value,
            dependent_category=data.dependent_category.value,
            date_of_birth=data.date_of_birth,
            age=data.age,
            pet_type=data.pet_type,
            pet_breed=data.pet_breed,
            monthly_cost_estimate=data.monthly_cost_estimate,
            support_start_date=data.support_start_date,
            support_end_date=data.support_end_date,
            remaining_semesters=data.remaining_semesters,
            shared_responsibility=data.shared_responsibility,
            cost_sharing_partners=data.cost_sharing_partners,
            your_share_percentage=data.your_share_percentage,
            partner_contribution_amount=data.partner_contribution_amount,
            institution_name=data.institution_name,
            semester_cost=data.semester_cost,
            special_needs=data.special_needs,
            notes=data.notes,
            profile_image_url=data.profile_image_url
        )
        
        self.db.add(dependent)
        self.db.flush()  # Get the ID without committing
        
        # Create expense types if provided
        if data.expense_types:
            for exp_type in data.expense_types:
                self._create_expense_type(dependent.dependent_id, exp_type)
        
        self.db.commit()
        self.db.refresh(dependent)
        
        return dependent
    
    def get_dependent(
        self,
        dependent_id: UUID,
        user_id: UUID
    ) -> Dependent:
        """Get a single dependent by ID"""
        
        dependent = self.db.query(Dependent).filter(
            Dependent.dependent_id == dependent_id,
            Dependent.user_id == user_id
        ).first()
        
        if not dependent:
            raise NotFoundError(f"Dependent {dependent_id} not found")
        
        return dependent
    
    def get_user_dependents(
        self,
        user_id: UUID,
        is_active: Optional[bool] = True,
        dependent_type: Optional[str] = None,
        dependent_category: Optional[str] = None
    ) -> List[Dependent]:
        """Get all dependents for a user"""
        
        query = self.db.query(Dependent).filter(
            Dependent.user_id == user_id
        )
        
        if is_active is not None:
            query = query.filter(Dependent.is_active == is_active)
        
        if dependent_type:
            query = query.filter(Dependent.dependent_type == dependent_type)
        
        if dependent_category:
            query = query.filter(Dependent.dependent_category == dependent_category)
        
        return query.order_by(Dependent.created_at.desc()).all()
    
    def update_dependent(
        self,
        dependent_id: UUID,
        user_id: UUID,
        data: DependentUpdate
    ) -> Dependent:
        """Update an existing dependent"""
        
        dependent = self.get_dependent(dependent_id, user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Handle enum conversions
        if 'relationship' in update_data and update_data['relationship']:
            update_data['relationship'] = update_data['relationship'].value
        if 'dependent_category' in update_data and update_data['dependent_category']:
            update_data['dependent_category'] = update_data['dependent_category'].value
        
        for field, value in update_data.items():
            setattr(dependent, field, value)
        
        self.db.commit()
        self.db.refresh(dependent)
        
        return dependent
    
    def delete_dependent(
        self,
        dependent_id: UUID,
        user_id: UUID,
        hard_delete: bool = False
    ) -> None:
        """Delete or deactivate a dependent"""
        
        dependent = self.get_dependent(dependent_id, user_id)
        
        if hard_delete:
            self.db.delete(dependent)
        else:
            dependent.is_active = False
        
        self.db.commit()
    
    # ============================================
    # EXPENSE TYPE MANAGEMENT
    # ============================================
    
    def _create_expense_type(
        self,
        dependent_id: UUID,
        data: ExpenseTypeCreate
    ) -> DependentExpenseType:
        """Create an expense type for a dependent"""
        
        expense_type = DependentExpenseType(
            dependent_id=dependent_id,
            type_name=data.type_name,
            description=data.description,
            expected_amount=data.expected_amount,
            frequency=data.frequency.value if data.frequency else None,
            is_recurring=data.is_recurring,
            monthly_budget=data.monthly_budget
        )
        
        self.db.add(expense_type)
        return expense_type
    
    def add_expense_type(
        self,
        dependent_id: UUID,
        user_id: UUID,
        data: ExpenseTypeCreate
    ) -> DependentExpenseType:
        """Add an expense type to a dependent"""
        
        # Verify ownership
        self.get_dependent(dependent_id, user_id)
        
        expense_type = self._create_expense_type(dependent_id, data)
        
        self.db.commit()
        self.db.refresh(expense_type)
        
        return expense_type
    
    def get_expense_types(
        self,
        dependent_id: UUID,
        user_id: UUID
    ) -> List[DependentExpenseType]:
        """Get all expense types for a dependent"""
        
        # Verify ownership
        self.get_dependent(dependent_id, user_id)
        
        return self.db.query(DependentExpenseType).filter(
            DependentExpenseType.dependent_id == dependent_id,
            DependentExpenseType.is_active == True
        ).all()
    
    # ============================================
    # EXPENSE TRACKING
    # ============================================
    
    def add_expense(
        self,
        dependent_id: UUID,
        user_id: UUID,
        data: DependentExpenseCreate
    ) -> DependentExpense:
        """Add an expense for a dependent"""
        
        dependent = self.get_dependent(dependent_id, user_id)
        
        # Calculate shares if shared
        your_share = data.your_share
        partner_share = data.partner_share
        
        if data.is_shared and dependent.shared_responsibility:
            if your_share is None:
                share_pct = float(dependent.your_share_percentage or 100) / 100
                your_share = Decimal(str(float(data.amount) * share_pct))
                partner_share = data.amount - your_share
        
        expense = DependentExpense(
            dependent_id=dependent_id,
            expense_type_id=data.expense_type_id,
            category_id=data.category_id,
            expense_name=data.expense_name,
            amount=data.amount,
            expense_date=data.expense_date,
            semester=data.semester,
            academic_year=data.academic_year,
            payment_method=data.payment_method,
            receipt_url=data.receipt_url,
            is_shared=data.is_shared,
            your_share=your_share,
            partner_share=partner_share,
            notes=data.notes
        )
        
        self.db.add(expense)
        
        # Update dependent's total spent
        dependent.total_spent_to_date = (dependent.total_spent_to_date or Decimal('0')) + data.amount
        
        # Update expense type if linked
        if data.expense_type_id:
            expense_type = self.db.query(DependentExpenseType).filter(
                DependentExpenseType.type_id == data.expense_type_id
            ).first()
            if expense_type:
                expense_type.total_spent = (expense_type.total_spent or Decimal('0')) + data.amount
                expense_type.last_expense_date = data.expense_date
        
        self.db.commit()
        self.db.refresh(expense)
        
        return expense
    
    def get_expenses(
        self,
        dependent_id: UUID,
        user_id: UUID,
        limit: int = 50,
        expense_type_id: Optional[UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[DependentExpense]:
        """Get expenses for a dependent"""
        
        # Verify ownership
        self.get_dependent(dependent_id, user_id)
        
        query = self.db.query(DependentExpense).filter(
            DependentExpense.dependent_id == dependent_id
        )
        
        if expense_type_id:
            query = query.filter(DependentExpense.expense_type_id == expense_type_id)
        
        if start_date:
            query = query.filter(DependentExpense.expense_date >= start_date)
        
        if end_date:
            query = query.filter(DependentExpense.expense_date <= end_date)
        
        return query.order_by(
            DependentExpense.expense_date.desc()
        ).limit(limit).all()
    
    # ============================================
    # SHARED COST MANAGEMENT
    # ============================================
    
    def create_shared_cost(
        self,
        dependent_id: UUID,
        user_id: UUID,
        data: SharedCostCreate
    ) -> DependentSharedCost:
        """Create a shared cost agreement"""
        
        # Verify ownership
        self.get_dependent(dependent_id, user_id)
        
        # Validate contributions add up
        total_contributions = float(data.your_contribution) + float(data.partner_contribution)
        if abs(total_contributions - float(data.total_cost)) > 0.01:
            raise ValidationError("Your contribution + partner contribution must equal total cost")
        
        shared_cost = DependentSharedCost(
            dependent_id=dependent_id,
            agreement_name=data.agreement_name,
            total_cost=data.total_cost,
            your_contribution=data.your_contribution,
            partner_name=data.partner_name,
            partner_contribution=data.partner_contribution,
            due_date=data.due_date,
            payment_period=data.payment_period,
            your_monthly_allocation=data.your_monthly_allocation,
            months_to_save=data.months_to_save,
            notes=data.notes
        )
        
        self.db.add(shared_cost)
        self.db.commit()
        self.db.refresh(shared_cost)
        
        return shared_cost
    
    def get_shared_costs(
        self,
        dependent_id: UUID,
        user_id: UUID,
        status: Optional[str] = None
    ) -> List[DependentSharedCost]:
        """Get shared costs for a dependent"""
        
        # Verify ownership
        self.get_dependent(dependent_id, user_id)
        
        query = self.db.query(DependentSharedCost).filter(
            DependentSharedCost.dependent_id == dependent_id
        )
        
        if status:
            query = query.filter(DependentSharedCost.status == status)
        
        return query.order_by(DependentSharedCost.due_date.asc()).all()
    
    def record_shared_cost_payment(
        self,
        shared_cost_id: UUID,
        user_id: UUID,
        data: SharedCostPaymentRequest
    ) -> DependentSharedCost:
        """Record a payment towards a shared cost"""
        
        # Get shared cost and verify ownership through dependent
        shared_cost = self.db.query(DependentSharedCost).filter(
            DependentSharedCost.shared_cost_id == shared_cost_id
        ).first()
        
        if not shared_cost:
            raise NotFoundError(f"Shared cost {shared_cost_id} not found")
        
        # Verify ownership
        self.get_dependent(shared_cost.dependent_id, user_id)
        
        # Update appropriate contribution
        if data.payer.lower() == 'you':
            shared_cost.your_contribution_paid = (
                (shared_cost.your_contribution_paid or Decimal('0')) + data.amount
            )
        else:
            shared_cost.partner_contribution_paid = (
                (shared_cost.partner_contribution_paid or Decimal('0')) + data.amount
            )
        
        # Check if completed
        if shared_cost.total_remaining <= 0:
            shared_cost.status = 'completed'
            shared_cost.completed_at = datetime.utcnow()
        else:
            shared_cost.status = 'in_progress'
        
        self.db.commit()
        self.db.refresh(shared_cost)
        
        return shared_cost
    
    # ============================================
    # SPECIAL SETUP HELPERS
    # ============================================
    
    def setup_brother_education(
        self,
        user_id: UUID,
        data: BrotherEducationSetup
    ) -> Dict[str, Any]:
        """
        Convenience method to set up brother's education support
        Creates dependent, expense types, and shared cost in one go
        """
        
        # Create the dependent
        dependent_data = DependentCreate(
            dependent_name=data.brother_name,
            relationship="brother",
            dependent_type="human",
            dependent_category="family_education",
            monthly_cost_estimate=data.monthly_savings_target or (data.your_contribution / Decimal('6')),
            support_start_date=date.today(),
            remaining_semesters=data.remaining_semesters,
            shared_responsibility=True,
            cost_sharing_partners=["Mom"],
            your_share_percentage=Decimal(str(
                float(data.your_contribution) / float(data.total_semester_cost) * 100
            )),
            partner_contribution_amount=data.mom_contribution,
            institution_name=data.institution_name,
            semester_cost=data.total_semester_cost,
            notes=data.notes,
            expense_types=[
                ExpenseTypeCreate(
                    type_name="Tuition",
                    frequency="semester",
                    expected_amount=data.total_semester_cost,
                    is_recurring=True
                ),
                ExpenseTypeCreate(
                    type_name="Books",
                    frequency="semester",
                    is_recurring=True
                ),
                ExpenseTypeCreate(
                    type_name="Living Expenses",
                    frequency="monthly",
                    is_recurring=True
                )
            ]
        )
        
        dependent = self.create_dependent(user_id, dependent_data)
        
        # Create the shared cost for current semester
        shared_cost_data = SharedCostCreate(
            agreement_name=f"Tuition - Next Semester",
            total_cost=data.total_semester_cost,
            your_contribution=data.your_contribution,
            partner_name="Mom",
            partner_contribution=data.mom_contribution,
            due_date=data.next_payment_due,
            your_monthly_allocation=data.monthly_savings_target,
            notes=f"Supporting {data.brother_name}'s education at {data.institution_name}"
        )
        
        shared_cost = self.create_shared_cost(dependent.dependent_id, user_id, shared_cost_data)
        
        return {
            "dependent": dependent,
            "shared_cost": shared_cost,
            "monthly_savings_needed": data.monthly_savings_target or (data.your_contribution / Decimal('6')),
            "remaining_semesters": data.remaining_semesters
        }
    
    def setup_pet(
        self,
        user_id: UUID,
        data: PetSetup
    ) -> Dependent:
        """
        Convenience method to set up a pet as a dependent
        """
        
        # Calculate monthly estimate
        monthly_estimate = Decimal('0')
        if data.monthly_food_cost:
            monthly_estimate += data.monthly_food_cost
        if data.monthly_litter_cost:
            monthly_estimate += data.monthly_litter_cost
        if data.rent_addition:
            monthly_estimate += data.rent_addition
        if data.estimated_vet_annual:
            monthly_estimate += data.estimated_vet_annual / 12
        
        expense_types = []
        
        if data.monthly_food_cost:
            expense_types.append(ExpenseTypeCreate(
                type_name="Food",
                frequency="monthly",
                expected_amount=data.monthly_food_cost,
                is_recurring=True,
                monthly_budget=data.monthly_food_cost
            ))
        
        if data.monthly_litter_cost:
            expense_types.append(ExpenseTypeCreate(
                type_name="Litter",
                frequency="monthly",
                expected_amount=data.monthly_litter_cost,
                is_recurring=True,
                monthly_budget=data.monthly_litter_cost
            ))
        
        if data.rent_addition:
            expense_types.append(ExpenseTypeCreate(
                type_name="Rent Addition",
                frequency="monthly",
                expected_amount=data.rent_addition,
                is_recurring=True,
                monthly_budget=data.rent_addition,
                description="Pet fee added to rent"
            ))
        
        if data.estimated_vet_annual:
            expense_types.append(ExpenseTypeCreate(
                type_name="Veterinary Care",
                frequency="as_needed",
                expected_amount=data.estimated_vet_annual,
                description="Annual vet estimate"
            ))
        
        dependent_data = DependentCreate(
            dependent_name=data.pet_name,
            relationship="pet",
            dependent_type="pet",
            dependent_category="pet_care",
            pet_type=data.pet_type,
            pet_breed=data.pet_breed,
            monthly_cost_estimate=monthly_estimate,
            notes=data.notes,
            expense_types=expense_types
        )
        
        return self.create_dependent(user_id, dependent_data)
    
    # ============================================
    # STATISTICS & ANALYTICS
    # ============================================
    
    def get_stats(self, user_id: UUID) -> DependentStats:
        """Get statistics for all dependents"""
        
        dependents = self.get_user_dependents(user_id, is_active=True)
        
        human_deps = [d for d in dependents if d.dependent_type == 'human']
        pet_deps = [d for d in dependents if d.dependent_type == 'pet']
        
        total_monthly = sum(float(d.monthly_cost_estimate or 0) for d in dependents)
        your_monthly = sum(d.your_monthly_share or 0 for d in dependents)
        
        # Get spending this month
        today = date.today()
        first_of_month = today.replace(day=1)
        
        monthly_expenses = self.db.query(
            func.sum(DependentExpense.amount)
        ).join(Dependent).filter(
            Dependent.user_id == user_id,
            DependentExpense.expense_date >= first_of_month
        ).scalar() or Decimal('0')
        
        # Get spending this year
        first_of_year = today.replace(month=1, day=1)
        
        yearly_expenses = self.db.query(
            func.sum(DependentExpense.amount)
        ).join(Dependent).filter(
            Dependent.user_id == user_id,
            DependentExpense.expense_date >= first_of_year
        ).scalar() or Decimal('0')
        
        # By category breakdown
        by_category: Dict[str, Decimal] = {}
        for d in dependents:
            cat = d.dependent_category
            by_category[cat] = by_category.get(cat, Decimal('0')) + Decimal(str(d.your_monthly_share or 0))
        
        return DependentStats(
            total_dependents=len(dependents),
            human_dependents=len(human_deps),
            pet_dependents=len(pet_deps),
            total_monthly_cost=Decimal(str(round(total_monthly, 2))),
            your_monthly_share=Decimal(str(round(your_monthly, 2))),
            total_spent_this_month=monthly_expenses,
            total_spent_this_year=yearly_expenses,
            time_bound_dependents=len([d for d in dependents if d.is_time_bound]),
            shared_responsibility_count=len([d for d in dependents if d.shared_responsibility]),
            by_category={k: round(float(v), 2) for k, v in by_category.items()}
        )
    
    def get_cost_projection(
        self,
        dependent_id: UUID,
        user_id: UUID,
        months_ahead: int = 12
    ) -> DependentCostProjection:
        """Project future costs for a dependent"""
        
        dependent = self.get_dependent(dependent_id, user_id)
        
        monthly_cost = dependent.your_monthly_share or 0
        
        # Generate monthly projections
        projections = []
        current = date.today()
        total_remaining = Decimal('0')
        
        for i in range(months_ahead):
            month_date = current.replace(day=1)
            if current.month + i > 12:
                years_ahead = (current.month + i - 1) // 12
                month_num = (current.month + i - 1) % 12 + 1
                month_date = month_date.replace(year=current.year + years_ahead, month=month_num)
            else:
                month_date = month_date.replace(month=current.month + i)
            
            # Check if still within support period
            if dependent.support_end_date and month_date > dependent.support_end_date:
                break
            
            projections.append({
                "month": month_date.strftime("%Y-%m"),
                "amount": monthly_cost
            })
            total_remaining += Decimal(str(monthly_cost))
        
        return DependentCostProjection(
            dependent_id=dependent.dependent_id,
            dependent_name=dependent.dependent_name,
            current_monthly_cost=Decimal(str(monthly_cost)),
            projected_total_remaining=total_remaining,
            projected_end_date=dependent.support_end_date,
            monthly_projections=projections,
            remaining_semesters=dependent.remaining_semesters,
            per_semester_cost=dependent.semester_cost
        )
    
    def get_monthly_summary(
        self,
        dependent_id: UUID,
        user_id: UUID,
        year: int,
        month: int
    ) -> DependentMonthlySummary:
        """Get or create monthly summary for a dependent"""
        
        # Verify ownership
        dependent = self.get_dependent(dependent_id, user_id)
        
        # Check if summary exists
        summary = self.db.query(DependentMonthlySummary).filter(
            DependentMonthlySummary.dependent_id == dependent_id,
            DependentMonthlySummary.year == year,
            DependentMonthlySummary.month == month
        ).first()
        
        if not summary:
            # Calculate summary
            expenses = self.db.query(DependentExpense).filter(
                DependentExpense.dependent_id == dependent_id,
                extract('year', DependentExpense.expense_date) == year,
                extract('month', DependentExpense.expense_date) == month
            ).all()
            
            total = sum(float(e.amount) for e in expenses)
            count = len(expenses)
            
            # Breakdown by expense type
            breakdown: Dict[str, float] = {}
            for e in expenses:
                if e.expense_type_id:
                    exp_type = self.db.query(DependentExpenseType).filter(
                        DependentExpenseType.type_id == e.expense_type_id
                    ).first()
                    if exp_type:
                        breakdown[exp_type.type_name] = breakdown.get(exp_type.type_name, 0) + float(e.amount)
                else:
                    breakdown['Other'] = breakdown.get('Other', 0) + float(e.amount)
            
            summary = DependentMonthlySummary(
                dependent_id=dependent_id,
                year=year,
                month=month,
                total_expenses=Decimal(str(total)),
                expense_count=count,
                expense_breakdown=breakdown
            )
            
            self.db.add(summary)
            self.db.commit()
            self.db.refresh(summary)
        
        return summary