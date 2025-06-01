-- FUNCTION: public.pg_stat_statements(boolean)

-- DROP FUNCTION IF EXISTS public.pg_stat_statements(boolean);

CREATE OR REPLACE FUNCTION public.pg_stat_statements(
	showtext boolean,
	OUT userid oid,
	OUT dbid oid,
	OUT toplevel boolean,
	OUT queryid bigint,
	OUT query text,
	OUT plans bigint,
	OUT total_plan_time double precision,
	OUT min_plan_time double precision,
	OUT max_plan_time double precision,
	OUT mean_plan_time double precision,
	OUT stddev_plan_time double precision,
	OUT calls bigint,
	OUT total_exec_time double precision,
	OUT min_exec_time double precision,
	OUT max_exec_time double precision,
	OUT mean_exec_time double precision,
	OUT stddev_exec_time double precision,
	OUT rows bigint,
	OUT shared_blks_hit bigint,
	OUT shared_blks_read bigint,
	OUT shared_blks_dirtied bigint,
	OUT shared_blks_written bigint,
	OUT local_blks_hit bigint,
	OUT local_blks_read bigint,
	OUT local_blks_dirtied bigint,
	OUT local_blks_written bigint,
	OUT temp_blks_read bigint,
	OUT temp_blks_written bigint,
	OUT blk_read_time double precision,
	OUT blk_write_time double precision,
	OUT temp_blk_read_time double precision,
	OUT temp_blk_write_time double precision,
	OUT wal_records bigint,
	OUT wal_fpi bigint,
	OUT wal_bytes numeric,
	OUT jit_functions bigint,
	OUT jit_generation_time double precision,
	OUT jit_inlining_count bigint,
	OUT jit_inlining_time double precision,
	OUT jit_optimization_count bigint,
	OUT jit_optimization_time double precision,
	OUT jit_emission_count bigint,
	OUT jit_emission_time double precision)
    RETURNS SETOF record 
    LANGUAGE 'c'
    COST 1
    VOLATILE STRICT PARALLEL SAFE 
    ROWS 1000

AS '$libdir/pg_stat_statements', 'pg_stat_statements_1_10'
;

ALTER FUNCTION public.pg_stat_statements(boolean)
    OWNER TO user; 