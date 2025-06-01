-- Table: public.db_settings_table

-- DROP TABLE IF EXISTS public.db_settings_table;

CREATE TABLE IF NOT EXISTS public.db_settings_table
(
    c_id bigint NOT NULL DEFAULT nextval('db_settings_table_c_id_seq'::regclass),
    c_car_time timestamp(6) without time zone,
    c_car_shakei smallint NOT NULL,
    c_car_1num smallint NOT NULL,
    c_car_item character(32) COLLATE pg_catalog."default" NOT NULL,
    c_label character(32) COLLATE pg_catalog."default" NOT NULL,
    c_limit smallint NOT NULL,
    c_limit_order character(8) COLLATE pg_catalog."default" NOT NULL,
    c_limit_diag character(8) COLLATE pg_catalog."default" NOT NULL,
    c_limit_opt smallint NOT NULL,
    c_systime timestamp(6) without time zone DEFAULT now()
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.db_settings_table
    OWNER to user;