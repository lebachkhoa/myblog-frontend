-- FUNCTION: public.pg_stat_statements_reset(oid, oid, bigint)

-- DROP FUNCTION IF EXISTS public.pg_stat_statements_reset(oid, oid, bigint);

CREATE OR REPLACE FUNCTION public.pg_stat_statements_reset(
	userid oid DEFAULT 0,
	dbid oid DEFAULT 0,
	queryid bigint DEFAULT 0)
    RETURNS void
    LANGUAGE 'c'
    COST 1
    VOLATILE STRICT PARALLEL SAFE 
AS '$libdir/pg_stat_statements', 'pg_stat_statements_reset_1_7'
;

ALTER FUNCTION public.pg_stat_statements_reset(oid, oid, bigint)
    OWNER TO user; 

GRANT EXECUTE ON FUNCTION public.pg_stat_statements_reset(oid, oid, bigint) TO user; 

REVOKE ALL ON FUNCTION public.pg_stat_statements_reset(oid, oid, bigint) FROM PUBLIC;
