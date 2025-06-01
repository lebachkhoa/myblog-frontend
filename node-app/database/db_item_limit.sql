-- Table: public.db_item_limit

-- DROP TABLE IF EXISTS public.db_item_limit;

CREATE TABLE IF NOT EXISTS public.db_item_limit
(
    c_id bigint NOT NULL DEFAULT nextval('db_item_limit_c_id_seq'::regclass),
    c_car_time timestamp without time zone,
    c_car_shakei smallint NOT NULL,
    c_car_1num smallint,
    c_hensei_name bytea,
    c_car_item character(32) COLLATE pg_catalog."default" NOT NULL,
    c_car_item_label character(32) COLLATE pg_catalog."default",
    c_limit bigint NOT NULL,
    c_limit_order character(8) COLLATE pg_catalog."default" NOT NULL,
    c_limit_diag character(8) COLLATE pg_catalog."default",
    c_limit_opt smallint,
    c_systime timestamp(6) without time zone DEFAULT now(),
    c_view boolean,
    c_tmsp_preset timestamp(6) without time zone,
    c_limit_t_0 integer,
    c_limit_t_1 integer,
    c_limit_t_0_1 integer,
    c_limit_t_1_0 integer
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.db_item_limit
    OWNER to admin; 

-- Trigger: trg_set_c_hensei_name_db_settings_table

-- DROP TRIGGER IF EXISTS trg_set_c_hensei_name_db_settings_table ON public.db_item_limit;

CREATE OR REPLACE TRIGGER trg_set_c_hensei_name_db_settings_table
    BEFORE INSERT OR UPDATE 
    ON public.db_item_limit
    FOR EACH ROW
    EXECUTE FUNCTION public.set_c_hensei_name();
