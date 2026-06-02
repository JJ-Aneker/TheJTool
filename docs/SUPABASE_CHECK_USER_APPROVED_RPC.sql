-- Create RPC function to check if user is approved (bypasses RLS)
-- This function has SECURITY DEFINER so it can query without RLS restrictions

CREATE OR REPLACE FUNCTION public.is_user_approved(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_approved BOOLEAN;
BEGIN
  SELECT approved INTO is_approved
  FROM profiles
  WHERE user_id = $1
  LIMIT 1;

  -- Return FALSE if user not found or not approved, TRUE if approved
  RETURN COALESCE(is_approved, FALSE);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_approved(UUID) TO authenticated;

-- Verify the function was created
SELECT * FROM pg_proc WHERE proname = 'is_user_approved';
