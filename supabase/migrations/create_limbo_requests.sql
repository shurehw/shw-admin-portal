-- Create limbo_requests table
CREATE TABLE IF NOT EXISTS public.limbo_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    
    -- Common fields
    name_of_item TEXT,
    brand_specific BOOLEAN DEFAULT false,
    brand_name VARCHAR(255),
    reference_link TEXT,
    preferred_vendor VARCHAR(255),
    stock_double_check BOOLEAN DEFAULT false,
    par_requested INTEGER,
    prev_price DECIMAL(10, 2),
    case_pack_number INTEGER,
    previous_case_count INTEGER,
    
    -- Conditional fields
    products_field TEXT,
    special_order_qty INTEGER,
    quote_field TEXT,
    existing_sku_search TEXT,
    sp_customer_field TEXT,
    
    -- User and metadata
    creator_id UUID REFERENCES auth.users(id),
    creator_name VARCHAR(255),
    creator_email VARCHAR(255),
    sales_rep_id UUID,
    sales_rep_name VARCHAR(255),
    
    -- Status and workflow
    status VARCHAR(50) DEFAULT 'pending',
    archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    notes TEXT,
    internal_notes TEXT,
    netsuite_id VARCHAR(100),
    
    CONSTRAINT type_check CHECK (type IN (
        'New Stock Item',
        'Specialty',
        'Need Better Pricing',
        'New Source Please',
        'Sample ONLY - Rush',
        'Convert to Stock',
        'Update Par-Request from Sales'
    ))
);

-- Create index for faster queries
CREATE INDEX idx_limbo_requests_creator ON public.limbo_requests(creator_id);
CREATE INDEX idx_limbo_requests_status ON public.limbo_requests(status);
CREATE INDEX idx_limbo_requests_type ON public.limbo_requests(type);
CREATE INDEX idx_limbo_requests_created_at ON public.limbo_requests(created_at DESC);
CREATE INDEX idx_limbo_requests_archived ON public.limbo_requests(archived);

-- Create table for file attachments
CREATE TABLE IF NOT EXISTS public.limbo_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.limbo_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_limbo_attachments_request ON public.limbo_attachments(request_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.limbo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limbo_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for limbo_requests
-- Policy for viewing: creators see their own, CS and admin see all
CREATE POLICY "Users can view their own requests" ON public.limbo_requests
    FOR SELECT
    USING (
        auth.uid() = creator_id 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR department = 'cs' OR department = 'customer_service')
        )
    );

-- Policy for creating: sales and CS can create
CREATE POLICY "Sales and CS can create requests" ON public.limbo_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND (department IN ('sales', 'cs', 'customer_service') OR role = 'admin')
        )
    );

-- Policy for updating: creators can update their own
CREATE POLICY "Users can update their own requests" ON public.limbo_requests
    FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments for visible requests" ON public.limbo_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.limbo_requests 
            WHERE id = request_id 
            AND (
                creator_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_id = auth.uid() 
                    AND (role = 'admin' OR department IN ('cs', 'customer_service'))
                )
            )
        )
    );

CREATE POLICY "Users can add attachments to their own requests" ON public.limbo_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.limbo_requests 
            WHERE id = request_id 
            AND creator_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_limbo_requests_updated_at
    BEFORE UPDATE ON public.limbo_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();