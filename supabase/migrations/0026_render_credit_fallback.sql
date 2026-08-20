-- Render-quota fallback: lets a render go through against
-- profiles.credit_balance once monthly_quota is exhausted (see
-- lib/auth.ts's authenticate() and index.ts's handleRender()).
--
-- This is a separate atomic decrement from increment_user_credits
-- (0025) on purpose: it must only ever take exactly 1 credit, and
-- only if at least 1 remains — a plain
--   UPDATE ... SET credit_balance = credit_balance - 1
-- without the WHERE guard could drive the balance negative under
-- concurrent requests. The UPDATE...WHERE + ROW_COUNT check makes the
-- "is there a credit left" check and the deduction a single atomic
-- operation, so two concurrent renders can't both spend the last credit.

CREATE OR REPLACE FUNCTION public.consume_render_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  UPDATE public.profiles
  SET credit_balance = credit_balance - 1
  WHERE id = p_user_id AND credit_balance > 0;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;
