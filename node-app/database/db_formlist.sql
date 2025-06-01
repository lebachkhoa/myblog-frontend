-- Table: public.db_formlist

-- DROP TABLE IF EXISTS public.db_formlist;

CREATE TABLE IF NOT EXISTS public.db_formlist
(
    shakei smallint NOT NULL,
    shaban smallint NOT NULL,
    tmsp text COLLATE pg_catalog."default" NOT NULL,
    gps text COLLATE pg_catalog."default",
    carnum smallint NOT NULL,
    carspeed smallint NOT NULL,
    station text COLLATE pg_catalog."default" NOT NULL,
    distance integer NOT NULL,
    retsuban text COLLATE pg_catalog."default" NOT NULL,
    hensei_no smallint NOT NULL,
    destination text COLLATE pg_catalog."default",
    notch text COLLATE pg_catalog."default",
    door smallint,
    trouble bytea,
    traintype text COLLATE pg_catalog."default",
    dataenable smallint,
    gpsenable smallint,
    troublelvl smallint,
    c_hensei_name bytea,
    CONSTRAINT uk_shakei_shaban UNIQUE (shakei, shaban)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.db_formlist
    OWNER to user; 

-- Trigger: trg_set_c_hensei_name_db_formlist

-- DROP TRIGGER IF EXISTS trg_set_c_hensei_name_db_formlist ON public.db_formlist;

CREATE OR REPLACE TRIGGER trg_set_c_hensei_name_db_formlist
    BEFORE INSERT OR UPDATE 
    ON public.db_formlist
    FOR EACH ROW
    EXECUTE FUNCTION public.set_c_hensei_name();