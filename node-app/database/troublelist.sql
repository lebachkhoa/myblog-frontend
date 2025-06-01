-- Table: public.troublelist

-- DROP TABLE IF EXISTS public.troublelist;

CREATE TABLE IF NOT EXISTS public.troublelist
(
    c_id bigint NOT NULL DEFAULT nextval('troublelist_c_id_seq'::regclass),
    c_trb_shakei smallint NOT NULL,
    c_trb_1num smallint NOT NULL,
    c_trb_time timestamp without time zone NOT NULL DEFAULT now(),
    c_trb_code integer NOT NULL,
    c_trb_car smallint NOT NULL,
    c_trb_clearcar smallint NOT NULL,
    c_td_state character(1) COLLATE pg_catalog."default" NOT NULL,
    c_td_from timestamp without time zone NOT NULL,
    c_td_to timestamp without time zone NOT NULL,
    c_td_filename character(32) COLLATE pg_catalog."default" NOT NULL,
    c_td_car_position character(1) COLLATE pg_catalog."default",
    c_td_car_ar_carkind character varying(32) COLLATE pg_catalog."default",
    c_td_car_ar_carnum character varying(48) COLLATE pg_catalog."default",
    c_trb_lvl smallint,
    c_hensei_name bytea,
    c_trb_systime timestamp(6) without time zone DEFAULT now()
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.troublelist
    OWNER to user; 

-- Trigger: trg_set_c_hensei_name_troublelist

-- DROP TRIGGER IF EXISTS trg_set_c_hensei_name_troublelist ON public.troublelist;

CREATE OR REPLACE TRIGGER trg_set_c_hensei_name_troublelist
    BEFORE INSERT OR UPDATE 
    ON public.troublelist
    FOR EACH ROW
    EXECUTE FUNCTION public.set_c_hensei_name();