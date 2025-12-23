-- ============================================
-- FORTUNA COMPLETE DATABASE SCHEMA
-- With Emotional Intelligence & AI Features
-- Week 1 Compatible + Future-Ready
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & PROFILES
-- ============================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    age_range VARCHAR(20) NOT NULL,
    occupation VARCHAR(100),
    household_size INTEGER DEFAULT 1,
    dependents_count INTEGER DEFAULT 0,
    risk_tolerance VARCHAR(20) DEFAULT 'moderate',
    spending_personality VARCHAR(50),
    primary_currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Location for tax calculation
    location_country VARCHAR(100) DEFAULT 'United States',
    location_state VARCHAR(100),
    location_city VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TAX RATES SYSTEM
-- ============================================

CREATE TABLE tax_rates (
    tax_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    city VARCHAR(100),
    federal_rate DECIMAL(5, 2),
    state_rate DECIMAL(5, 2),
    city_rate DECIMAL(5, 2),
    fica_rate DECIMAL(5, 2) DEFAULT 7.65,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country, state, city, year)
);

-- ============================================
-- INCOME SOURCES (ENHANCED)
-- ============================================

CREATE TABLE income_sources (
    income_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    
    -- Pay structure (NEW)
    pay_structure VARCHAR(20) NOT NULL,
    pay_rate DECIMAL(10, 2),
    pay_unit VARCHAR(20),
    
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    next_payment_date DATE,
    
    -- Work constraints (NEW)
    max_hours_per_week INTEGER,
    expected_hours_per_period DECIMAL(5, 2),
    
    -- Tax information (NEW)
    tax_rate_federal DECIMAL(5, 2),
    tax_rate_state DECIMAL(5, 2),
    tax_rate_city DECIMAL(5, 2),
    tax_rate_fica DECIMAL(5, 2) DEFAULT 7.65,
    
    is_recurring BOOLEAN DEFAULT TRUE,
    is_guaranteed BOOLEAN DEFAULT TRUE,
    reliability_score DECIMAL(3, 2) DEFAULT 1.0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE income_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id UUID REFERENCES income_sources(income_id) ON DELETE CASCADE,
    
    -- Work logged (NEW)
    hours_worked DECIMAL(5, 2),
    days_worked DECIMAL(5, 2),
    sessions_worked INTEGER,
    
    -- Payment breakdown (NEW)
    gross_amount DECIMAL(12, 2) NOT NULL,
    tax_federal DECIMAL(12, 2) DEFAULT 0,
    tax_state DECIMAL(12, 2) DEFAULT 0,
    tax_city DECIMAL(12, 2) DEFAULT 0,
    tax_fica DECIMAL(12, 2) DEFAULT 0,
    total_tax DECIMAL(12, 2),
    net_amount DECIMAL(12, 2) NOT NULL,
    
    expected_amount DECIMAL(12, 2),
    variance DECIMAL(12, 2),
    
    payment_date DATE NOT NULL,
    payment_period VARCHAR(50),
    
    -- AI learning (NEW)
    ai_calculated BOOLEAN DEFAULT FALSE,
    user_confirmed BOOLEAN DEFAULT FALSE,
    user_corrected BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EXPENSE CATEGORIES & TRACKING
-- ============================================

CREATE TABLE expense_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id UUID REFERENCES expense_categories(category_id) ON DELETE SET NULL,
    category_type VARCHAR(20) NOT NULL,
    is_essential BOOLEAN DEFAULT TRUE,
    monthly_budget DECIMAL(12, 2),
    icon VARCHAR(50),
    seasonality_factor DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_name)
);

CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(category_id) ON DELETE SET NULL,
    
    expense_name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    expense_time TIME,
    
    payment_method VARCHAR(50),
    merchant_name VARCHAR(255),
    location VARCHAR(255),
    
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_frequency VARCHAR(20),
    next_occurrence_date DATE,
    
    tags TEXT[],
    notes TEXT,
    receipt_url VARCHAR(500),
    
    is_planned BOOLEAN DEFAULT FALSE,
    logged_immediately BOOLEAN DEFAULT FALSE,
    
    ai_confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMOTIONAL EXPENSE TRACKING (NEW!)
-- ============================================

CREATE TABLE expense_emotions (
    emotion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(expense_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Contextual classification
    was_urgent BOOLEAN DEFAULT FALSE,
    was_necessary BOOLEAN DEFAULT FALSE,
    is_asset BOOLEAN DEFAULT FALSE,
    
    -- Emotional state
    primary_emotion VARCHAR(50) NOT NULL,
    emotion_intensity INTEGER CHECK (emotion_intensity >= 1 AND emotion_intensity <= 10),
    secondary_emotions TEXT[],
    
    -- Reasoning
    purchase_reason TEXT NOT NULL,
    
    -- Context
    time_of_day VARCHAR(20),
    day_type VARCHAR(20),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    
    -- Later reflection
    regret_level INTEGER CHECK (regret_level >= 1 AND regret_level <= 10),
    brought_joy BOOLEAN,
    would_buy_again BOOLEAN,
    reflection_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reflected_at TIMESTAMP
);

-- ============================================
-- DAILY CHECK-IN SYSTEM (NEW!)
-- ============================================

CREATE TABLE daily_checkins (
    checkin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    
    -- Completion tracking
    expenses_logged BOOLEAN DEFAULT FALSE,
    emotions_captured BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    -- Streak tracking
    is_streak_day BOOLEAN DEFAULT TRUE,
    current_streak INTEGER DEFAULT 0,
    
    -- Reminder system
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    reminder_responded BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, checkin_date)
);

CREATE TABLE spending_streaks (
    streak_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_start_date DATE,
    last_activity_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MONTHLY EMOTIONAL ANALYSIS (NEW!)
-- ============================================

CREATE TABLE monthly_emotional_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    month DATE NOT NULL,
    
    -- Spending summary
    total_spending DECIMAL(12, 2) NOT NULL,
    emotional_spending_amount DECIMAL(12, 2) NOT NULL,
    emotional_spending_percentage DECIMAL(5, 2),
    
    -- Emotional patterns
    most_common_emotion VARCHAR(50),
    most_expensive_emotion VARCHAR(50),
    spending_triggers JSONB,
    
    -- Time patterns
    highest_spending_time VARCHAR(20),
    highest_spending_day VARCHAR(20),
    
    -- Category analysis
    emotional_categories JSONB,
    
    -- AI-generated insights
    ai_observations TEXT,
    behavioral_recommendations TEXT[],
    meal_suggestions TEXT[],
    
    -- User reflection
    user_reflection TEXT,
    action_items TEXT[],
    reflection_completed BOOLEAN DEFAULT FALSE,
    reflection_completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reflection_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES monthly_emotional_analysis(analysis_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    user_response TEXT NOT NULL,
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BEHAVIORAL PATTERNS (NEW!)
-- ============================================

CREATE TABLE user_behavior_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_name VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(3, 2) NOT NULL,
    frequency VARCHAR(50),
    avg_impact DECIMAL(12, 2),
    triggers JSONB,
    time_of_occurrence JSONB,
    affected_categories TEXT[],
    first_detected DATE NOT NULL,
    last_occurred DATE,
    occurrence_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emotional_triggers (
    trigger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    trigger_name VARCHAR(255) NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    typical_category VARCHAR(100),
    avg_spending_when_triggered DECIMAL(12, 2),
    occurrence_count INTEGER DEFAULT 1,
    preventive_suggestions TEXT[],
    user_acknowledged BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MEAL SUGGESTIONS SYSTEM (NEW!)
-- ============================================

CREATE TABLE meal_suggestions (
    meal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    meal_name VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time_minutes INTEGER NOT NULL,
    estimated_cost DECIMAL(6, 2),
    dietary_tags TEXT[],
    meal_type VARCHAR(50),
    
    -- User interaction
    times_suggested INTEGER DEFAULT 0,
    times_made INTEGER DEFAULT 0,
    user_liked BOOLEAN,
    user_notes TEXT,
    
    -- AI relevance
    suggested_for_emotion VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FINANCIAL GOALS
-- ============================================

CREATE TABLE financial_goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    goal_name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0.0,
    deadline_date DATE,
    priority_level INTEGER NOT NULL CHECK (priority_level >= 1 AND priority_level <= 10),
    is_mandatory BOOLEAN DEFAULT FALSE,
    
    -- Investment first principle
    monthly_allocation DECIMAL(12, 2),
    treat_as_bill BOOLEAN DEFAULT FALSE,
    
    confidence_score DECIMAL(3, 2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE goal_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES financial_goals(goal_id) ON DELETE CASCADE,
    milestone_name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    target_date DATE NOT NULL,
    achieved_date DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goal_progress_history (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES financial_goals(goal_id) ON DELETE CASCADE,
    amount_added DECIMAL(12, 2) NOT NULL,
    new_total DECIMAL(12, 2) NOT NULL,
    progress_percentage DECIMAL(5, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- RECURRING EXPENSES
-- ============================================

CREATE TABLE recurring_expenses (
    recurring_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(category_id) ON DELETE SET NULL,
    expense_name VARCHAR(255) NOT NULL,
    
    base_amount DECIMAL(12, 2) NOT NULL,
    is_variable BOOLEAN DEFAULT FALSE,
    min_amount DECIMAL(12, 2),
    max_amount DECIMAL(12, 2),
    avg_amount DECIMAL(12, 2),
    
    frequency VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    
    auto_pay BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    provider_name VARCHAR(255),
    account_number VARCHAR(100),
    
    notes TEXT,
    reminder_days_before INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recurring_expense_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_id UUID REFERENCES recurring_expenses(recurring_id) ON DELETE CASCADE,
    amount_paid DECIMAL(12, 2) NOT NULL,
    expected_amount DECIMAL(12, 2),
    variance DECIMAL(12, 2),
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DEPENDENTS & SHARED COSTS
-- ============================================

CREATE TABLE dependents (
    dependent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    dependent_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    dependent_type VARCHAR(20) NOT NULL,
    dependent_category VARCHAR(50) NOT NULL,
    
    date_of_birth DATE,
    age INTEGER,
    
    monthly_cost_estimate DECIMAL(12, 2),
    
    -- Shared responsibility
    shared_responsibility BOOLEAN DEFAULT FALSE,
    cost_sharing_partners TEXT[],
    partner_contribution_amount DECIMAL(12, 2),
    
    special_needs TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dependent_expenses (
    dependent_expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_id UUID REFERENCES dependents(dependent_id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(category_id) ON DELETE SET NULL,
    expense_name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dependent_shared_costs (
    shared_cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_id UUID REFERENCES dependents(dependent_id) ON DELETE CASCADE,
    partner_name VARCHAR(255) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    your_contribution DECIMAL(12, 2) NOT NULL,
    partner_contribution DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    semester VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BUDGETS & ALLOCATIONS
-- ============================================

CREATE TABLE budgets (
    budget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    budget_name VARCHAR(255) NOT NULL,
    budget_period VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_income DECIMAL(12, 2) NOT NULL,
    total_allocated DECIMAL(12, 2) DEFAULT 0.0,
    emergency_buffer DECIMAL(12, 2) DEFAULT 0.0,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    ai_version VARCHAR(20),
    confidence_score DECIMAL(3, 2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(budget_id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(category_id) ON DELETE CASCADE,
    allocated_amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) DEFAULT 0.0,
    remaining_amount DECIMAL(12, 2),
    utilization_percentage DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI INSIGHTS & RECOMMENDATIONS
-- ============================================

CREATE TABLE ai_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    confidence_score DECIMAL(3, 2) NOT NULL,
    potential_savings DECIMAL(12, 2),
    affected_categories TEXT[],
    data_points JSONB,
    is_actionable BOOLEAN DEFAULT TRUE,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE ai_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority_level INTEGER NOT NULL,
    estimated_impact DECIMAL(12, 2),
    implementation_difficulty VARCHAR(20),
    steps_to_implement JSONB,
    related_categories TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    user_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP
);

-- ============================================
-- SEASONAL PATTERNS
-- ============================================

CREATE TABLE seasonal_patterns (
    seasonal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(category_id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    avg_spending DECIMAL(12, 2) NOT NULL,
    variance DECIMAL(12, 2) NOT NULL,
    year_over_year_growth DECIMAL(5, 2),
    special_events TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, month)
);

-- ============================================
-- ANOMALY DETECTION
-- ============================================

CREATE TABLE expense_anomalies (
    anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(expense_id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    expected_value DECIMAL(12, 2),
    actual_value DECIMAL(12, 2),
    deviation_percentage DECIMAL(5, 2),
    confidence_score DECIMAL(3, 2) NOT NULL,
    requires_attention BOOLEAN DEFAULT FALSE,
    user_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMERGENCY EVENTS
-- ============================================

CREATE TABLE emergency_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    covered_by_emergency_fund DECIMAL(12, 2) DEFAULT 0.0,
    covered_by_other DECIMAL(12, 2) DEFAULT 0.0,
    event_date DATE NOT NULL,
    resolution_date DATE,
    impact_on_goals TEXT,
    ai_adjustment_made BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI MODEL TRAINING DATA
-- ============================================

CREATE TABLE ai_training_data (
    training_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL,
    output_label JSONB NOT NULL,
    model_prediction JSONB,
    accuracy_score DECIMAL(3, 2),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FINANCIAL ACCOUNTS (for future bank integration)
-- ============================================

CREATE TABLE financial_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    institution_name VARCHAR(255),
    current_balance DECIMAL(12, 2) NOT NULL,
    available_balance DECIMAL(12, 2),
    credit_limit DECIMAL(12, 2),
    interest_rate DECIMAL(5, 2),
    account_number_masked VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDICES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expense_emotions_user ON expense_emotions(user_id);
CREATE INDEX idx_expense_emotions_emotion ON expense_emotions(primary_emotion);
CREATE INDEX idx_income_sources_user ON income_sources(user_id);
CREATE INDEX idx_income_history_date ON income_history(payment_date DESC);
CREATE INDEX idx_financial_goals_user_status ON financial_goals(user_id, status);
CREATE INDEX idx_recurring_expenses_next_due ON recurring_expenses(next_due_date) WHERE is_active = TRUE;
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_monthly_analysis_user_month ON monthly_emotional_analysis(user_id, month DESC);
CREATE INDEX idx_ai_insights_user_created ON ai_insights(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_dependents_user ON dependents(user_id);
CREATE INDEX idx_behavioral_patterns_user ON user_behavior_patterns(user_id);

-- ============================================
-- TRIGGERS FOR AUTOMATION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_sources_updated_at BEFORE UPDATE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_expenses_updated_at BEFORE UPDATE ON recurring_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dependents_updated_at BEFORE UPDATE ON dependents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

CREATE OR REPLACE VIEW user_financial_summary AS
SELECT 
    u.user_id,
    u.full_name,
    COALESCE(SUM(i.amount), 0) as total_monthly_income,
    COUNT(DISTINCT g.goal_id) as active_goals_count,
    COUNT(DISTINCT d.dependent_id) as dependents_count,
    COUNT(DISTINCT dc.checkin_id) FILTER (WHERE dc.expenses_logged = TRUE) as checkin_streak
FROM users u
LEFT JOIN income_sources i ON u.user_id = i.user_id AND i.is_active = TRUE
LEFT JOIN financial_goals g ON u.user_id = g.user_id AND g.status = 'active'
LEFT JOIN dependents d ON u.user_id = d.user_id
LEFT JOIN daily_checkins dc ON u.user_id = dc.user_id AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.user_id, u.full_name;

CREATE OR REPLACE VIEW emotional_spending_summary AS
SELECT 
    e.user_id,
    ee.primary_emotion,
    DATE_TRUNC('month', e.expense_date) as month,
    COUNT(*) as transaction_count,
    SUM(e.amount) as total_spent,
    AVG(e.amount) as avg_transaction,
    AVG(ee.emotion_intensity) as avg_emotion_intensity
FROM expenses e
JOIN expense_emotions ee ON e.expense_id = ee.expense_id
GROUP BY e.user_id, ee.primary_emotion, DATE_TRUNC('month', e.expense_date);

CREATE OR REPLACE VIEW goal_progress_view AS
SELECT 
    g.goal_id,
    g.user_id,
    g.goal_name,
    g.target_amount,
    g.current_amount,
    g.deadline_date,
    ROUND((g.current_amount / NULLIF(g.target_amount, 0) * 100)::numeric, 2) as completion_percentage,
    CASE 
        WHEN g.deadline_date IS NULL THEN NULL
        ELSE (g.deadline_date - CURRENT_DATE)
    END as days_remaining,
    CASE 
        WHEN g.deadline_date IS NULL THEN NULL
        ELSE ROUND(((g.target_amount - g.current_amount) / NULLIF((g.deadline_date - CURRENT_DATE)::numeric, 0))::numeric, 2)
    END as required_daily_savings
FROM financial_goals g
WHERE g.status = 'active';

-- ============================================
-- SEED DATA: Default Expense Categories
-- ============================================

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $func$
BEGIN
    -- Essential categories
    INSERT INTO expense_categories (user_id, category_name, category_type, is_essential, icon) VALUES
        (p_user_id, 'Food & Groceries', 'variable', TRUE, 'shopping-cart'),
        (p_user_id, 'Rent/Housing', 'fixed', TRUE, 'home'),
        (p_user_id, 'Utilities', 'variable', TRUE, 'zap'),
        (p_user_id, 'Transportation', 'variable', TRUE, 'car'),
        (p_user_id, 'Healthcare', 'variable', TRUE, 'heart'),
        (p_user_id, 'Insurance', 'fixed', TRUE, 'shield'),
        (p_user_id, 'Education', 'fixed', TRUE, 'book');
    
    -- Variable categories
    INSERT INTO expense_categories (user_id, category_name, category_type, is_essential, icon) VALUES
        (p_user_id, 'Eating Out', 'discretionary', FALSE, 'utensils'),
        (p_user_id, 'Entertainment', 'discretionary', FALSE, 'film'),
        (p_user_id, 'Shopping', 'discretionary', FALSE, 'shopping-bag'),
        (p_user_id, 'Pet Care', 'variable', TRUE, 'paw'),
        (p_user_id, 'Gifts', 'discretionary', FALSE, 'gift'),
        (p_user_id, 'Subscriptions', 'fixed', FALSE, 'repeat'),
        (p_user_id, 'Personal Care', 'variable', FALSE, 'smile'),
        (p_user_id, 'Fitness', 'variable', FALSE, 'activity');
END;
$func$ LANGUAGE plpgsql;


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE expense_emotions IS 'Captures emotional state and reasoning for each purchase - the core of Fortuna''s unique approach';
COMMENT ON TABLE daily_checkins IS 'Tracks daily expense logging completion and maintains user engagement streaks';
COMMENT ON TABLE monthly_emotional_analysis IS 'AI-generated monthly analysis of spending patterns and emotional triggers';
COMMENT ON TABLE emotional_triggers IS 'Identified patterns where specific emotions lead to spending';
COMMENT ON TABLE meal_suggestions IS 'Personalized meal recommendations to prevent stress-eating and save money';
COMMENT ON TABLE user_behavior_patterns IS 'AI-detected behavioral patterns in spending (exam weeks, weekends, etc.)';
COMMENT ON TABLE income_sources IS 'Enhanced to support multiple pay structures (hourly, salary) with tax tracking';
COMMENT ON TABLE dependents IS 'Tracks financial responsibilities including humans, pets, and shared costs';
COMMENT ON TABLE financial_goals IS 'Goals with AI confidence scoring and "invest first" principle support';

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

-- Get user's emotional spending breakdown
-- SELECT primary_emotion, SUM(amount) as total, COUNT(*) as count
-- FROM expenses e
-- JOIN expense_emotions ee ON e.expense_id = ee.expense_id
-- WHERE e.user_id = 'USER_ID'
-- GROUP BY primary_emotion
-- ORDER BY total DESC;

-- Check current streak
-- SELECT current_streak, last_activity_date
-- FROM spending_streaks
-- WHERE user_id = 'USER_ID' AND streak_type = 'daily_logging' AND is_active = TRUE;

-- Get monthly emotional analysis
-- SELECT month, total_spending, emotional_spending_percentage, most_common_emotion
-- FROM monthly_emotional_analysis
-- WHERE user_id = 'USER_ID'
-- ORDER BY month DESC
-- LIMIT 6;

-- Find active behavioral patterns
-- SELECT pattern_name, avg_impact, occurrence_count, last_occurred
-- FROM user_behavior_patterns
-- WHERE user_id = 'USER_ID' AND is_active = TRUE
-- ORDER BY avg_impact DESC;

-- ============================================
-- DATABASE READY!
-- ============================================

-- This schema includes:
-- ✓ Week 1: Basic tracking (users, expenses, income)
-- ✓ Emotional intelligence (expense_emotions, daily_checkins)
-- ✓ Behavioral learning (patterns, triggers)
-- ✓ AI features (insights, recommendations)
-- ✓ Goals with "invest first" principle
-- ✓ Dependents with shared costs
-- ✓ Tax-aware income tracking
-- ✓ All relationships properly defined
-- ✓ Optimized with indexes
-- ✓ Ready for mobile app integration