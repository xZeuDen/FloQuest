
-- Stores the nine job categories available on FloQuest
CREATE TABLE public.categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Add the categories workers can select
INSERT INTO public.categories (name)
VALUES
    ('General Handyman & Home Repairs'),
    ('Electrical & Lighting'),
    ('Plumbing & Bathroom'),
    ('Gardening & Outdoor'),
    ('Cleaning Services'),
    ('Painting & Decorating'),
    ('Moving & Delivery'),
    ('Technology & Smart Home'),
    ('Errands & Everyday Help');

-- Enable row level security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to read categories
REVOKE ALL ON public.categories FROM anon, authenticated;
GRANT SELECT ON public.categories TO authenticated;

CREATE POLICY "Authenticated users can view categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);
