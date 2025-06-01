-- FUNCTION: public.pg_stat_statements_info()

-- DROP FUNCTION IF EXISTS public.pg_stat_statements_info();

CREATE OR REPLACE FUNCTION public.pg_stat_statements_info(
	OUT dealloc bigint,
	OUT stats_reset timestamp with time zone)
    RETURNS record
    LANGUAGE 'c'
    COST 1
    VOLATILE STRICT PARALLEL SAFE 
AS '$libdir/pg_stat_statements', 'pg_stat_statements_info'
;

ALTER FUNCTION public.pg_stat_statements_info()
    OWNER TO user; 