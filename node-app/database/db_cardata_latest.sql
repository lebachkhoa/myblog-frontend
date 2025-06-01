CREATE TABLE IF NOT EXISTS public.db_cardata_latest
(
    c_car_time timestamp without time zone NOT NULL DEFAULT now(),
    c_car_shakei smallint NOT NULL,
    c_car_1num smallint NOT NULL,
    c_hensei_name bytea,
    c_car_data bytea,
    CONSTRAINT db_cardata_latest_pkey PRIMARY KEY (c_car_shakei, c_car_1num)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.db_cardata_latest
    OWNER to user; 

-- Trigger: trg_set_c_hensei_name_db_cardata_latest

-- DROP TRIGGER IF EXISTS trg_set_c_hensei_name_db_cardata_latest ON public.db_cardata_latest;

CREATE OR REPLACE TRIGGER trg_set_c_hensei_name_db_cardata_latest
    BEFORE INSERT OR UPDATE 
    ON public.db_cardata_latest
    FOR EACH ROW
    EXECUTE FUNCTION public.set_c_hensei_name();