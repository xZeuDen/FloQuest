
-- Return open jobs matching a worker's categories and travel radius
CREATE OR REPLACE FUNCTION public.discover_jobs()
RETURNS TABLE (
  job_id BIGINT,
  title TEXT,
  description TEXT,
  category_name TEXT,
  price NUMERIC,
  estimated_minutes INTEGER,
  distance_km NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    j.id AS job_id,
    j.title,
    j.description,
    c.name AS category_name,
    j.price,
    j.estimated_minutes,
    ROUND(d.distance_km::NUMERIC, 1) AS distance_km

  FROM public.worker_profiles w

  -- Confirm that the account belongs to a worker
  JOIN public.profiles p
    ON p.id = w.id AND p.role = 'worker'

  -- Find the categories selected by this worker
  JOIN public.worker_categories wc
    ON wc.worker_id = w.id

  -- Find jobs belonging to those categories
  JOIN public.jobs j
    ON j.category_id = wc.category_id

  JOIN public.categories c
    ON c.id = j.category_id

  -- Calculate distance between worker and job in kilometres
  CROSS JOIN LATERAL (
    SELECT
      6371.0 * 2.0 * ASIN(
        LEAST(1.0, SQRT(
          POWER(SIN(RADIANS(j.latitude - w.latitude) / 2.0), 2)
          +
          COS(RADIANS(w.latitude))
          * COS(RADIANS(j.latitude))
          * POWER(SIN(RADIANS(j.longitude - w.longitude) / 2.0), 2)
        ))
      ) AS distance_km
  ) d

  WHERE
    -- Only use the currently logged-in worker
    w.id = (SELECT auth.uid())

    -- The worker must be available
    AND w.is_available = TRUE

    -- Only show jobs waiting for a worker
    AND j.status = 'open'

    -- Only show jobs inside the worker's travel radius
    AND d.distance_km <= w.travel_radius_km

  -- Show the closest jobs first
  ORDER BY d.distance_km ASC, j.created_at DESC;
$$;

-- Only logged-in users may call this function.
-- The function itself checks worker role and availability.
REVOKE ALL ON FUNCTION public.discover_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.discover_jobs() FROM anon;

GRANT EXECUTE ON FUNCTION public.discover_jobs()
TO authenticated;
