
-- Stores additional information for users registered as workers
CREATE TABLE public.worker_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    -- Worker's location coordinates
    latitude DOUBLE PRECISION NOT NULL
        CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL
        CHECK (longitude BETWEEN -180 AND 180),

    -- Maximum distance the worker is willing to travel
    travel_radius_km INTEGER NOT NULL DEFAULT 10
        CHECK (travel_radius_km BETWEEN 1 AND 100),

    -- Workers start offline until they choose to go online
    is_available BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Connects workers to the job categories they have selected
-- A worker can have multiple categories
CREATE TABLE public.worker_categories (
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id)
        ON DELETE CASCADE,

    category_id BIGINT NOT NULL REFERENCES public.categories(id)
        ON DELETE CASCADE,

    -- Prevents the same category being added twice for one worker
    PRIMARY KEY (worker_id, category_id)
);

-- Helps us find workers belonging to a particular category
CREATE INDEX worker_categories_category_idx
ON public.worker_categories(category_id);


-- Enable Row Level Security for both tables
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_categories ENABLE ROW LEVEL SECURITY;

-- Grant only the operations needed by the frontend
REVOKE ALL ON public.worker_profiles FROM anon, authenticated;
REVOKE ALL ON public.worker_categories FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON public.worker_profiles TO authenticated;

GRANT SELECT, INSERT, DELETE
ON public.worker_categories TO authenticated;


-- WORKER PROFILE SECURITY

-- Workers can view their own profile
CREATE POLICY "Workers can view their profile"
ON public.worker_profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

-- Only users registered as workers can create a worker profile
CREATE POLICY "Workers can create their profile"
ON public.worker_profiles
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = id
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'worker'
    )
);

-- Workers can update their own location, radius and availability
CREATE POLICY "Workers can update their profile"
ON public.worker_profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);


-- WORKER CATEGORY SECURITY

-- Workers can view their selected categories
CREATE POLICY "Workers can view their categories"
ON public.worker_categories
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = worker_id);

-- Workers can add categories to their own profile
CREATE POLICY "Workers can add categories"
ON public.worker_categories
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = worker_id);

-- Workers can remove categories from their own profile
CREATE POLICY "Workers can remove categories"
ON public.worker_categories
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = worker_id);
