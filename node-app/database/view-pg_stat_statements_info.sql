-- View: public.pg_stat_statements_info

-- DROP VIEW public.pg_stat_statements_info;

CREATE OR REPLACE VIEW public.pg_stat_statements_info
 AS
 SELECT pg_stat_statements_info.dealloc,
    pg_stat_statements_info.stats_reset
   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);

ALTER TABLE public.pg_stat_statements_info
    OWNER TO user; 

GRANT SELECT ON TABLE public.pg_stat_statements_info TO PUBLIC;
GRANT ALL ON TABLE public.pg_stat_statements_info TO user; 

