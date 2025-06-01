-- FUNCTION: public.update_c_systime()

-- DROP FUNCTION IF EXISTS public.update_c_systime();

CREATE OR REPLACE FUNCTION public.update_c_systime()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    NEW.c_systime = now();
    RETURN NEW;
END;
$BODY$;

ALTER FUNCTION public.update_c_systime()
    OWNER TO user;