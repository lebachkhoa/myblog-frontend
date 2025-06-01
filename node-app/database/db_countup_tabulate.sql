-- tao bang db_countup_tabulate
CREATE TABLE IF NOT EXISTS public.db_countup_tabulate (
    c_id bigserial NOT NULL,
    c_car_item TIMESTAMP(6) without time zone,
    c_car_shakei smallint NOT NULL,             -- smallint: keu du lieu 2 bytes
    c_car_1num smallint NOT NULL,
    tmsp_from TIMESTAMP without time zone,
    tmsp_to TIMESTAMP without time zone,
    alert text collate pg_catalog."default",
    tmsp_num smallint NOT NULL,
    reset_tmsp TIMESTAMP without time zone,
    reset_item text collate pg_catalog."default",
    filename text collate pg_catalog."default"
)

-- chuyen quyen so huu bang cho user admin (cao hon Grant ... to admin)
ALTER TABLE IF EXISTS public.db_countup_tabulate OWNER to admin;