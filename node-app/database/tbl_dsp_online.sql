-- Table: public.tbl_dsp_online

-- DROP TABLE IF EXISTS public.tbl_dsp_online;

CREATE TABLE IF NOT EXISTS public.tbl_dsp_online
(
    c_car_shakei smallint NOT NULL,
    c_car_1num smallint NOT NULL,
    c_hensei_name bytea,
    CONSTRAINT tbl_dsp_online_pkey PRIMARY KEY (c_car_shakei, c_car_1num)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tbl_dsp_online
    OWNER to user;