CREATE TABLE IF NOT EXISTS public.datapicklist
(
    c_id bigint NOT NULL DEFAULT nextval('datapicklist_c_id_seq'::regclass),
    c_entrytmsp timestamp(6) without time zone NOT NULL DEFAULT now(),
    c_state character(1) COLLATE pg_catalog."default" NOT NULL,
    c_user text COLLATE pg_catalog."default",
    c_car_type smallint NOT NULL,
    c_car_shakei smallint,
    c_car_1num smallint NOT NULL,
    c_hensei_name bytea,
    c_pick_from timestamp(6) without time zone NOT NULL,
    c_pick_to timestamp(6) without time zone NOT NULL,
    c_pick_items text COLLATE pg_catalog."default",
    c_pick_filename character(32) COLLATE pg_catalog."default",
    c_pick_comment text COLLATE pg_catalog."default",
    c_systime timestamp(6) without time zone DEFAULT now(),
    CONSTRAINT datapicklist_pkey PRIMARY KEY (c_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.datapicklist
    OWNER to admin; 

-- Trigger: trg_set_c_hensei_name_db_datapicklist

-- DROP TRIGGER IF EXISTS trg_set_c_hensei_name_db_datapicklist ON public.datapicklist;

CREATE OR REPLACE TRIGGER trg_set_c_hensei_name_db_datapicklist
    BEFORE INSERT OR UPDATE 
    ON public.datapicklist
    FOR EACH ROW
    EXECUTE FUNCTION public.set_c_hensei_name();
