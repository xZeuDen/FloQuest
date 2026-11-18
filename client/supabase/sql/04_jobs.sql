
-- Stores jobs posted by customers
CREATE TABLE public.jobs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Link each job to the customer who posted it
    customer_id UUID NOT NULL REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    -- Link the job to one of our nine categories
    category_id BIGINT NOT NULL REFERENCES public.categories(id),

    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Customer's offered price in euros
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),

    -- Estimated time needed to complete the job
    estimated_minutes INTEGER NOT NULL
        CHECK (estimated_minutes > 0),

    -- Location used for matching nearby workers
    latitude DOUBLE PRECISION NOT NULL
        CHECK (latitude BETWEEN -90 AND 90),

    longitude DOUBLE PRECISION NOT NULL
        CHECK (longitude BETWEEN -180 AND 180),

    -- All new jobs start as open
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN (
            'open',
            'assigned',
            'in_progress',
            'completed',
            'cancelled'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable security for the jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.jobs FROM anon, authenticated;

GRANT SELECT, INSERT ON public.jobs TO authenticated;

-- Customers can view jobs they have posted
CREATE POLICY "Customers can view their jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = customer_id);

-- Only customer accounts can create jobs for themselves
CREATE POLICY "Customers can post jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = customer_id
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'customer'
    )
);
