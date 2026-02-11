-- ============================================================================
-- ACCUBOOKS PRODUCTION DATABASE - MISSING TABLES IMPLEMENTATION
-- Comprehensive schema completion for AR, AP, Tax, Inventory, Projects
-- Includes: Foreign keys, CHECK constraints, RLS policies, audit triggers
-- ============================================================================

-- ============================================================================
-- PART 1: ACCOUNTS RECEIVABLE TABLES
-- ============================================================================

-- Invoice Line Items (detail table for invoices)
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(19, 4) NOT NULL CHECK (unit_price >= 0),
    discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    tax_rate DECIMAL(7, 4) DEFAULT 0 CHECK (tax_rate >= 0),
    subtotal DECIMAL(19, 4) NOT NULL,
    tax_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total DECIMAL(19, 4) NOT NULL,
    account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_invoice_line UNIQUE (invoice_id, line_number),
    CONSTRAINT calculated_subtotal CHECK (subtotal = ROUND(quantity * unit_price * (1 - discount_percent/100), 4)),
    CONSTRAINT calculated_tax CHECK (tax_amount = ROUND(subtotal * tax_rate/100, 4)),
    CONSTRAINT calculated_total CHECK (total = subtotal + tax_amount)
);

CREATE INDEX idx_invoice_lines_company ON invoice_line_items(company_id);
CREATE INDEX idx_invoice_lines_invoice ON invoice_line_items(invoice_id);

-- Credit Memos
CREATE TABLE credit_memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    credit_memo_number VARCHAR(50) NOT NULL,
    reference_invoice_id UUID REFERENCES invoices(id),
    issue_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'issued', 'applied', 'voided')),
    reason VARCHAR(50) NOT NULL 
        CHECK (reason IN ('return', 'damage', 'discount', 'error', 'goodwill')),
    description TEXT,
    subtotal DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (total >= 0),
    amount_applied DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (amount_applied >= 0),
    amount_remaining DECIMAL(19, 4) NOT NULL DEFAULT 0,
    gl_transaction_id UUID REFERENCES transactions(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT unique_company_creditmemo_number UNIQUE (company_id, credit_memo_number),
    CONSTRAINT amount_remaining_calc CHECK (amount_remaining = total - amount_applied)
);

CREATE INDEX idx_credit_memos_company ON credit_memos(company_id);
CREATE INDEX idx_credit_memos_customer ON credit_memos(company_id, customer_id);
CREATE INDEX idx_credit_memos_status ON credit_memos(company_id, status);
CREATE INDEX idx_credit_memos_reference ON credit_memos(reference_invoice_id);

-- Credit Memo Applications (linking credit memos to invoices)
CREATE TABLE credit_memo_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    credit_memo_id UUID NOT NULL REFERENCES credit_memos(id) ON DELETE RESTRICT,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount_applied DECIMAL(19, 4) NOT NULL CHECK (amount_applied > 0),
    applied_date DATE NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_creditmemo_invoice UNIQUE (credit_memo_id, invoice_id)
);

CREATE INDEX idx_cm_applications_company ON credit_memo_applications(company_id);
CREATE INDEX idx_cm_applications_creditmemo ON credit_memo_applications(credit_memo_id);
CREATE INDEX idx_cm_applications_invoice ON credit_memo_applications(invoice_id);

-- Write-offs
CREATE TABLE write_offs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    write_off_date DATE NOT NULL,
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    reason VARCHAR(50) NOT NULL 
        CHECK (reason IN ('uncollectible', 'disputed', 'bankruptcy', 'settlement', 'other')),
    description TEXT,
    bad_debt_account_id UUID NOT NULL REFERENCES accounts(id),
    gl_transaction_id UUID REFERENCES transactions(id),
    approved_by UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_invoice_writeoff UNIQUE (invoice_id)
);

CREATE INDEX idx_write_offs_company ON write_offs(company_id);
CREATE INDEX idx_write_offs_customer ON write_offs(company_id, customer_id);
CREATE INDEX idx_write_offs_date ON write_offs(company_id, write_off_date);

-- ============================================================================
-- PART 2: ACCOUNTS PAYABLE TABLES
-- ============================================================================

-- Bills (AP Invoices from Vendors)
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    bill_number VARCHAR(50) NOT NULL,
    vendor_invoice_number VARCHAR(50),
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'partially_paid', 'paid', 'voided')),
    description TEXT,
    terms VARCHAR(100),
    subtotal DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (total >= 0),
    amount_paid DECIMAL(19, 4) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance_due DECIMAL(19, 4) NOT NULL DEFAULT 0,
    is_1099_eligible BOOLEAN DEFAULT FALSE,
    tax_1099_category VARCHAR(50),
    gl_transaction_id UUID REFERENCES transactions(id),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,
    idempotency_key VARCHAR(255) UNIQUE,
    CONSTRAINT unique_company_bill_number UNIQUE (company_id, bill_number),
    CONSTRAINT valid_due_date CHECK (due_date >= bill_date),
    CONSTRAINT balance_calc CHECK (balance_due = total - amount_paid)
);

CREATE INDEX idx_bills_company ON bills(company_id);
CREATE INDEX idx_bills_vendor ON bills(company_id, vendor_id);
CREATE INDEX idx_bills_status ON bills(company_id, status);
CREATE INDEX idx_bills_due_date ON bills(company_id, due_date) WHERE status NOT IN ('paid', 'voided');
CREATE INDEX idx_bills_1099 ON bills(company_id, is_1099_eligible, tax_1099_category) WHERE is_1099_eligible = TRUE;

-- Bill Line Items
CREATE TABLE bill_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_cost DECIMAL(19, 4) NOT NULL CHECK (unit_cost >= 0),
    amount DECIMAL(19, 4) NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    is_1099_eligible BOOLEAN DEFAULT FALSE,
    tax_1099_category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_bill_line UNIQUE (bill_id, line_number),
    CONSTRAINT calculated_amount CHECK (amount = ROUND(quantity * unit_cost, 4))
);

CREATE INDEX idx_bill_lines_company ON bill_line_items(company_id);
CREATE INDEX idx_bill_lines_bill ON bill_line_items(bill_id);

-- Bill Payments
CREATE TABLE bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL 
        CHECK (payment_method IN ('check', 'ach', 'wire', 'credit_card', 'cash', 'other')),
    check_number VARCHAR(50),
    reference_number VARCHAR(100),
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    bank_account_id UUID NOT NULL REFERENCES accounts(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'cleared', 'voided')),
    cleared_date DATE,
    memo TEXT,
    gl_transaction_id UUID REFERENCES transactions(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID,
    void_reason TEXT,
    idempotency_key VARCHAR(255) UNIQUE
);

CREATE INDEX idx_bill_payments_company ON bill_payments(company_id);
CREATE INDEX idx_bill_payments_vendor ON bill_payments(company_id, vendor_id);
CREATE INDEX idx_bill_payments_date ON bill_payments(company_id, payment_date);

-- Bill Payment Applications (linking payments to bills)
CREATE TABLE bill_payment_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    bill_payment_id UUID NOT NULL REFERENCES bill_payments(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
    amount_applied DECIMAL(19, 4) NOT NULL CHECK (amount_applied > 0),
    discount_taken DECIMAL(19, 4) DEFAULT 0 CHECK (discount_taken >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_payment_bill UNIQUE (bill_payment_id, bill_id)
);

CREATE INDEX idx_bp_applications_company ON bill_payment_applications(company_id);
CREATE INDEX idx_bp_applications_payment ON bill_payment_applications(bill_payment_id);
CREATE INDEX idx_bp_applications_bill ON bill_payment_applications(bill_id);

-- 1099 Payments Summary
CREATE TABLE vendor_1099_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    tax_year INTEGER NOT NULL,
    box_1_nonemployee_comp DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_2_royalties DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_3_other_income DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_4_federal_withholding DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_5_fishing_boat DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_6_medical_payments DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_7_substitute_payments DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_8_dividends DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_9_direct_sales DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_10_crop_insurance DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_13_excess_golden_parachute DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_14_gross_proceeds DECIMAL(19, 4) NOT NULL DEFAULT 0,
    box_16_state_withholding DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_1099_amount DECIMAL(19, 4) GENERATED ALWAYS AS (
        box_1_nonemployee_comp + box_2_royalties + box_3_other_income +
        box_5_fishing_boat + box_6_medical_payments + box_7_substitute_payments +
        box_8_dividends + box_10_crop_insurance + box_13_excess_golden_parachute +
        box_14_gross_proceeds
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_vendor_1099_year UNIQUE (company_id, vendor_id, tax_year),
    CONSTRAINT valid_tax_year CHECK (tax_year >= 2000 AND tax_year <= 2100)
);

CREATE INDEX idx_1099_payments_company ON vendor_1099_payments(company_id);
CREATE INDEX idx_1099_payments_vendor ON vendor_1099_payments(company_id, vendor_id);
CREATE INDEX idx_1099_payments_year ON vendor_1099_payments(company_id, tax_year);

-- ============================================================================
-- PART 3: TAX ENGINE TABLES
-- ============================================================================

-- Tax Rates by Jurisdiction
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tax_type VARCHAR(20) NOT NULL 
        CHECK (tax_type IN ('sales', 'vat', 'gst', 'use', 'excise', 'other')),
    jurisdiction_type VARCHAR(20) NOT NULL 
        CHECK (jurisdiction_type IN ('country', 'state', 'province', 'county', 'city', 'district', 'special')),
    country_code CHAR(2) NOT NULL,  -- ISO 3166-1 alpha-2
    state_code VARCHAR(10),
    county VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    district_code VARCHAR(50),
    rate DECIMAL(7, 4) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    is_compound BOOLEAN DEFAULT FALSE,  -- Compound tax (tax on tax)
    is_inclusive BOOLEAN DEFAULT FALSE,  -- Tax included in price
    effective_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > effective_date),
    CONSTRAINT unique_tax_jurisdiction UNIQUE (company_id, tax_type, jurisdiction_type, country_code, COALESCE(state_code, ''), COALESCE(county, ''), COALESCE(city, ''), COALESCE(postal_code, ''), effective_date)
);

CREATE INDEX idx_tax_rates_company ON tax_rates(company_id);
CREATE INDEX idx_tax_rates_location ON tax_rates(country_code, state_code, county, city);
CREATE INDEX idx_tax_rates_active ON tax_rates(company_id, is_active, effective_date);

-- Tax Transactions (record of all tax calculations)
CREATE TABLE tax_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    source_type VARCHAR(30) NOT NULL 
        CHECK (source_type IN ('invoice', 'bill', 'sale', 'purchase', 'adjustment')),
    source_id UUID NOT NULL,
    source_line_id UUID,
    tax_rate_id UUID NOT NULL REFERENCES tax_rates(id),
    jurisdiction_name VARCHAR(255) NOT NULL,
    taxable_amount DECIMAL(19, 4) NOT NULL CHECK (taxable_amount >= 0),
    tax_amount DECIMAL(19, 4) NOT NULL,
    tax_rate_applied DECIMAL(7, 4) NOT NULL,
    is_inclusive BOOLEAN NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT calculated_tax CHECK (
        CASE 
            WHEN is_inclusive THEN ABS(tax_amount - ROUND(taxable_amount * tax_rate_applied / (100 + tax_rate_applied), 4)) <= 0.01
            ELSE ABS(tax_amount - ROUND(taxable_amount * tax_rate_applied / 100, 4)) <= 0.01
        END
    )
);

CREATE INDEX idx_tax_transactions_company ON tax_transactions(company_id);
CREATE INDEX idx_tax_transactions_source ON tax_transactions(source_type, source_id);
CREATE INDEX idx_tax_transactions_rate ON tax_transactions(tax_rate_id);
CREATE INDEX idx_tax_transactions_date ON tax_transactions(company_id, calculated_at);

-- Nexus Tracking (tax presence by jurisdiction)
CREATE TABLE nexus_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    country_code CHAR(2) NOT NULL,
    state_code VARCHAR(10),
    county VARCHAR(100),
    city VARCHAR(100),
    nexus_type VARCHAR(20) NOT NULL 
        CHECK (nexus_type IN ('physical', 'economic', 'affiliate', 'click_through', 'marketplace')),
    established_date DATE NOT NULL,
    threshold_amount DECIMAL(19, 4),
    threshold_transaction_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_nexus UNIQUE (company_id, country_code, COALESCE(state_code, ''), COALESCE(county, ''), COALESCE(city, ''), nexus_type)
);

CREATE INDEX idx_nexus_tracking_company ON nexus_tracking(company_id);
CREATE INDEX idx_nexus_tracking_location ON nexus_tracking(country_code, state_code);

-- Purchase Tax (use tax tracking)
CREATE TABLE purchase_tax (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    bill_id UUID REFERENCES bills(id),
    vendor_id UUID REFERENCES vendors(id),
    purchase_date DATE NOT NULL,
    description TEXT,
    total_amount DECIMAL(19, 4) NOT NULL,
    taxable_amount DECIMAL(19, 4) NOT NULL,
    tax_paid_to_vendor DECIMAL(19, 4) NOT NULL DEFAULT 0,
    use_tax_owed DECIMAL(19, 4) NOT NULL DEFAULT 0,
    jurisdiction VARCHAR(255) NOT NULL,
    tax_rate DECIMAL(7, 4) NOT NULL,
    is_reported BOOLEAN DEFAULT FALSE,
    reported_period_id UUID REFERENCES accounting_periods(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT use_tax_calc CHECK (use_tax_owed = ROUND((taxable_amount * tax_rate / 100) - tax_paid_to_vendor, 4))
);

CREATE INDEX idx_purchase_tax_company ON purchase_tax(company_id);
CREATE INDEX idx_purchase_tax_bill ON purchase_tax(bill_id);
CREATE INDEX idx_purchase_tax_reported ON purchase_tax(company_id, is_reported);

-- ============================================================================
-- PART 4: INVENTORY TABLES
-- ============================================================================

-- Inventory Items (master catalog)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'each',
    barcode VARCHAR(100),
    cost_method VARCHAR(10) NOT NULL DEFAULT 'FIFO' 
        CHECK (cost_method IN ('FIFO', 'LIFO', 'AVG', 'SPECIFIC')),
    
    -- Valuation accounts
    inventory_account_id UUID NOT NULL REFERENCES accounts(id),
    cogs_account_id UUID NOT NULL REFERENCES accounts(id),
    revenue_account_id UUID REFERENCES accounts(id),
    adjustment_account_id UUID REFERENCES accounts(id),
    
    -- Pricing
    standard_cost DECIMAL(19, 4),
    list_price DECIMAL(19, 4),
    
    -- Physical attributes
    weight DECIMAL(10, 4),
    weight_unit VARCHAR(10),
    dimensions TEXT,
    
    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_inventoried BOOLEAN DEFAULT TRUE,  -- FALSE for non-stock items
    track_lots BOOLEAN DEFAULT FALSE,
    track_serials BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,
    
    CONSTRAINT unique_company_sku UNIQUE (company_id, sku)
);

CREATE INDEX idx_inventory_items_company ON inventory_items(company_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(company_id, sku);
CREATE INDEX idx_inventory_items_category ON inventory_items(company_id, category);
CREATE INDEX idx_inventory_items_active ON inventory_items(company_id, is_active);

-- Inventory Balances (quantity and value by location)
CREATE TABLE inventory_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    location_id UUID REFERENCES dimension_values(id),  -- Can be NULL for 'all locations'
    
    -- Quantities
    quantity_on_hand DECIMAL(15, 4) NOT NULL DEFAULT 0,
    quantity_reserved DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available DECIMAL(15, 4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    
    -- Valuation
    average_cost DECIMAL(19, 4),
    total_value DECIMAL(19, 4) GENERATED ALWAYS AS (quantity_on_hand * COALESCE(average_cost, 0)) STORED,
    
    -- Reorder
    reorder_point DECIMAL(15, 4) DEFAULT 0,
    reorder_quantity DECIMAL(15, 4) DEFAULT 0,
    preferred_vendor_id UUID REFERENCES vendors(id),
    
    -- Tracking
    last_counted_at TIMESTAMP WITH TIME ZONE,
    last_movement_at TIMESTAMP WITH TIME ZONE,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_item_location UNIQUE (company_id, item_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::UUID)),
    CONSTRAINT positive_quantity CHECK (quantity_on_hand >= 0)  -- PREVENT NEGATIVE INVENTORY
);

CREATE INDEX idx_inventory_balances_company ON inventory_balances(company_id);
CREATE INDEX idx_inventory_balances_item ON inventory_balances(item_id);
CREATE INDEX idx_inventory_balances_location ON inventory_balances(location_id);
CREATE INDEX idx_inventory_balances_low ON inventory_balances(company_id, quantity_available, reorder_point) WHERE quantity_available <= reorder_point;

-- Inventory Transactions (all movements)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    transaction_number VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL 
        CHECK (transaction_type IN ('receipt', 'issue', 'transfer', 'adjustment', 'sale', 'purchase_return', 'assembly', 'disassembly')),
    
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    from_location_id UUID REFERENCES dimension_values(id),
    to_location_id UUID REFERENCES dimension_values(id),
    
    -- Quantities
    quantity DECIMAL(15, 4) NOT NULL CHECK (quantity <> 0),
    unit_cost DECIMAL(19, 4),
    total_cost DECIMAL(19, 4),
    
    -- References
    reference_type VARCHAR(30),  -- 'invoice', 'bill', 'transfer', 'adjustment'
    reference_id UUID,
    gl_transaction_id UUID REFERENCES transactions(id),
    
    -- Lot/Serial tracking
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    expiry_date DATE,
    
    -- Metadata
    transaction_date DATE NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idempotency_key VARCHAR(255) UNIQUE,
    
    CONSTRAINT valid_transfer CHECK (
        (transaction_type = 'transfer' AND from_location_id IS NOT NULL AND to_location_id IS NOT NULL) OR
        (transaction_type != 'transfer')
    ),
    CONSTRAINT unique_transaction_number UNIQUE (company_id, transaction_number)
);

CREATE INDEX idx_inventory_transactions_company ON inventory_transactions(company_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(company_id, transaction_date);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(company_id, transaction_type);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);

-- Inventory Cost Layers (for FIFO/LIFO tracking)
CREATE TABLE inventory_cost_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    location_id UUID REFERENCES dimension_values(id),
    
    -- Layer details
    receipt_date DATE NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(19, 4) NOT NULL,
    remaining_quantity DECIMAL(15, 4) NOT NULL CHECK (remaining_quantity >= 0),
    
    -- Reference
    receipt_transaction_id UUID REFERENCES inventory_transactions(id),
    lot_number VARCHAR(100),
    
    -- Consumption tracking
    is_fully_consumed BOOLEAN DEFAULT FALSE,
    consumed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT remaining_not_exceed_quantity CHECK (remaining_quantity <= quantity)
);

CREATE INDEX idx_cost_layers_company ON inventory_cost_layers(company_id);
CREATE INDEX idx_cost_layers_item ON inventory_cost_layers(item_id);
CREATE INDEX idx_cost_layers_unconsumed ON inventory_cost_layers(item_id, is_fully_consumed, receipt_date) WHERE is_fully_consumed = FALSE;

-- ============================================================================
-- PART 5: PROJECT ACCOUNTING TABLES
-- ============================================================================

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Client/Customer
    customer_id UUID REFERENCES customers(id),
    
    -- Status and type
    status VARCHAR(20) NOT NULL DEFAULT 'planning' 
        CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    project_type VARCHAR(20) NOT NULL DEFAULT 'fixed_fee' 
        CHECK (project_type IN ('fixed_fee', 'time_materials', 'cost_plus', 'retainer')),
    
    -- Dates
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    
    -- Financial
    contract_value DECIMAL(19, 4),
    estimated_cost DECIMAL(19, 4),
    estimated_hours DECIMAL(10, 2),
    
    -- Billing
    billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('weekly', 'biweekly', 'monthly', 'milestone', 'upon_completion')),
    billing_address TEXT,
    
    -- Project manager
    project_manager_id UUID,  -- Reference to employees/users
    
    -- Accounts
    wip_account_id UUID REFERENCES accounts(id),
    revenue_account_id UUID REFERENCES accounts(id),
    cost_account_id UUID REFERENCES accounts(id),
    
    -- Metadata
    is_billable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,
    
    CONSTRAINT unique_company_project_code UNIQUE (company_id, project_code)
);

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_customer ON projects(company_id, customer_id);
CREATE INDEX idx_projects_status ON projects(company_id, status);

-- Project Time Entries
CREATE TABLE project_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    employee_id UUID NOT NULL,  -- Reference to employees
    
    -- Time details
    entry_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    
    -- Billing
    is_billable BOOLEAN DEFAULT TRUE,
    billable_rate DECIMAL(19, 4),
    billable_amount DECIMAL(19, 4) GENERATED ALWAYS AS (
        CASE WHEN is_billable THEN hours * COALESCE(billable_rate, 0) ELSE 0 END
    ) STORED,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'posted')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    posted_to_wip_at TIMESTAMP WITH TIME ZONE,
    
    -- Details
    description TEXT NOT NULL,
    task_id UUID,  -- Reference to project tasks if implemented
    
    -- References
    wip_transaction_id UUID REFERENCES transactions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idempotency_key VARCHAR(255) UNIQUE
);

CREATE INDEX idx_time_entries_company ON project_time_entries(company_id);
CREATE INDEX idx_time_entries_project ON project_time_entries(project_id);
CREATE INDEX idx_time_entries_employee ON project_time_entries(company_id, employee_id);
CREATE INDEX idx_time_entries_date ON project_time_entries(company_id, entry_date);
CREATE INDEX idx_time_entries_status ON project_time_entries(status, posted_to_wip_at) WHERE status = 'approved' AND posted_to_wip_at IS NULL;

-- Project Expenses
CREATE TABLE project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    employee_id UUID,  -- Employee who incurred the expense
    
    -- Expense details
    expense_date DATE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    
    -- Amounts
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    total_amount DECIMAL(19, 4) NOT NULL,
    
    -- Billing
    is_billable BOOLEAN DEFAULT TRUE,
    is_reimbursable BOOLEAN DEFAULT TRUE,
    markup_percent DECIMAL(5, 2) DEFAULT 0,
    billed_amount DECIMAL(19, 4),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'posted', 'billed')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    posted_to_wip_at TIMESTAMP WITH TIME ZONE,
    
    -- Details
    description TEXT NOT NULL,
    receipt_url TEXT,
    expense_category VARCHAR(50),
    
    -- References
    bill_id UUID REFERENCES bills(id),
    wip_transaction_id UUID REFERENCES transactions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    
    CONSTRAINT calculated_total CHECK (total_amount = amount + tax_amount)
);

CREATE INDEX idx_project_expenses_company ON project_expenses(company_id);
CREATE INDEX idx_project_expenses_project ON project_expenses(project_id);
CREATE INDEX idx_project_expenses_status ON project_expenses(status, posted_to_wip_at) WHERE status = 'approved' AND posted_to_wip_at IS NULL;

-- Project WIP Summary (calculated, but tracked for performance)
CREATE TABLE project_wip_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id),
    
    -- Costs
    total_labor_cost DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_expense_cost DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_material_cost DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_overhead DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_wip_cost DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Billings
    total_billed DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_billable_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_billable_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Calculated
    percent_complete DECIMAL(5, 2),
    recognized_revenue DECIMAL(19, 4) NOT NULL DEFAULT 0,
    gross_profit DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Status
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT calculated_wip CHECK (total_wip_cost = total_labor_cost + total_expense_cost + total_material_cost + total_overhead)
);

CREATE INDEX idx_project_wip_company ON project_wip_summary(company_id);
CREATE INDEX idx_project_wip_active ON project_wip_summary(company_id, is_closed) WHERE is_closed = FALSE;

-- ============================================================================
-- PART 6: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_memo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE write_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_1099_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tax ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cost_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_wip_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimension_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company isolation
CREATE POLICY company_isolation_accounts ON accounts
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_transactions ON transactions
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_transaction_lines ON transaction_lines
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_invoices ON invoices
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_invoice_lines ON invoice_line_items
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_credit_memos ON credit_memos
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_cm_applications ON credit_memo_applications
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_write_offs ON write_offs
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_bills ON bills
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_bill_lines ON bill_line_items
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_bill_payments ON bill_payments
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_bp_applications ON bill_payment_applications
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_1099_payments ON vendor_1099_payments
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_tax_rates ON tax_rates
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_tax_transactions ON tax_transactions
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_nexus ON nexus_tracking
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_purchase_tax ON purchase_tax
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_inventory_items ON inventory_items
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_inventory_balances ON inventory_balances
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_inventory_transactions ON inventory_transactions
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_cost_layers ON inventory_cost_layers
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_projects ON projects
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_time_entries ON project_time_entries
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_project_expenses ON project_expenses
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_wip_summary ON project_wip_summary
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_accounting_periods ON accounting_periods
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_customers ON customers
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_vendors ON vendors
    USING (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================================
-- PART 7: AUDIT & INTEGRITY TRIGGERS
-- ============================================================================

-- Function to set company context (must be called by application)
CREATE OR REPLACE FUNCTION set_company_context(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_company_id', p_company_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Prevent negative inventory trigger
CREATE OR REPLACE FUNCTION prevent_negative_inventory()
RETURNS TRIGGER AS $$
DECLARE
    current_qty DECIMAL(15, 4);
BEGIN
    -- Get current quantity for the item/location
    SELECT quantity_on_hand INTO current_qty
    FROM inventory_balances
    WHERE item_id = NEW.item_id AND location_id = NEW.to_location_id;
    
    IF current_qty IS NULL THEN
        current_qty := 0;
    END IF;
    
    -- Check if transaction would cause negative
    IF NEW.transaction_type = 'issue' OR NEW.transaction_type = 'sale' THEN
        IF current_qty + NEW.quantity < 0 THEN  -- quantity is negative for issues
            RAISE EXCEPTION 'Insufficient inventory: item % at location % has % units, attempted to remove % units',
                NEW.item_id, NEW.to_location_id, current_qty, ABS(NEW.quantity);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_negative_inventory
    BEFORE INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_negative_inventory();

-- Auto-update balance on transaction trigger
CREATE OR REPLACE FUNCTION update_inventory_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_cost DECIMAL(19, 4);
    v_item RECORD;
BEGIN
    -- Get item cost method
    SELECT cost_method, average_cost INTO v_item
    FROM inventory_items WHERE id = NEW.item_id;
    
    -- Update or create balance record
    IF NEW.transaction_type = 'receipt' THEN
        INSERT INTO inventory_balances (company_id, item_id, location_id, quantity_on_hand, average_cost)
        VALUES (NEW.company_id, NEW.item_id, NEW.to_location_id, NEW.quantity, NEW.unit_cost)
        ON CONFLICT (company_id, item_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::UUID))
        DO UPDATE SET 
            quantity_on_hand = inventory_balances.quantity_on_hand + NEW.quantity,
            average_cost = CASE 
                WHEN v_item.cost_method = 'AVG' THEN
                    (inventory_balances.total_value + NEW.total_cost) / (inventory_balances.quantity_on_hand + NEW.quantity)
                ELSE inventory_balances.average_cost
            END,
            last_movement_at = NOW();
    ELSIF NEW.transaction_type IN ('issue', 'sale') THEN
        UPDATE inventory_balances
        SET quantity_on_hand = quantity_on_hand + NEW.quantity,  -- quantity is negative
            last_movement_at = NOW()
        WHERE item_id = NEW.item_id AND (location_id = NEW.from_location_id OR (location_id IS NULL AND NEW.from_location_id IS NULL));
    ELSIF NEW.transaction_type = 'transfer' THEN
        -- Reduce from source
        UPDATE inventory_balances
        SET quantity_on_hand = quantity_on_hand - NEW.quantity,
            last_movement_at = NOW()
        WHERE item_id = NEW.item_id AND (location_id = NEW.from_location_id OR (location_id IS NULL AND NEW.from_location_id IS NULL));
        
        -- Add to destination
        INSERT INTO inventory_balances (company_id, item_id, location_id, quantity_on_hand)
        VALUES (NEW.company_id, NEW.item_id, NEW.to_location_id, NEW.quantity)
        ON CONFLICT (company_id, item_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::UUID))
        DO UPDATE SET 
            quantity_on_hand = inventory_balances.quantity_on_hand + NEW.quantity,
            last_movement_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_balance
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_balance();

-- Audit timestamp trigger
CREATE OR REPLACE FUNCTION update_audit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables with updated_at
CREATE TRIGGER update_timestamp_accounts BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_credit_memos BEFORE UPDATE ON credit_memos FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_bills BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_inventory_items BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_inventory_balances BEFORE UPDATE ON inventory_balances FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_projects BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_project_expenses BEFORE UPDATE ON project_expenses FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();
CREATE TRIGGER update_timestamp_time_entries BEFORE UPDATE ON project_time_entries FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();

-- ============================================================================
-- END OF SCHEMA IMPLEMENTATION
-- ============================================================================
