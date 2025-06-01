-- FUNCTION: public.upsert_db_cardata_latest()

-- DROP FUNCTION IF EXISTS public.upsert_db_cardata_latest();

CREATE OR REPLACE FUNCTION public.upsert_db_cardata_latest()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
    new_milliseconds INTEGER;
BEGIN
    -- Extract milliseconds from the new record
    new_milliseconds := EXTRACT(MILLISECONDS FROM NEW.c_car_time);

    -- Insertのクエリの時間が 200以下
    --IF new_milliseconds <= 200 THEN
	    -- 既存のレコードがあるかチェック
	    IF EXISTS (SELECT 1 FROM public.db_cardata_latest 
	               WHERE c_car_shakei = NEW.c_car_shakei AND c_car_1num = NEW.c_car_1num) THEN
	        -- 既存のレコードがあれば更新（UPSERT）
	        UPDATE public.db_cardata_latest 
	        SET c_car_time = NEW.c_car_time, c_car_data = NEW.c_car_data
	        WHERE c_car_shakei = NEW.c_car_shakei AND c_car_1num = NEW.c_car_1num;
	    ELSE
	        -- 既存のレコードがなければ挿入
	        INSERT INTO public.db_cardata_latest (c_car_time, c_car_shakei, c_car_1num, c_car_data)
	        VALUES (NEW.c_car_time, NEW.c_car_shakei, NEW.c_car_1num, NEW.c_car_data);
	    END IF;
   --END IF;
    RETURN NULL;
END;
$BODY$;

ALTER FUNCTION public.upsert_db_cardata_latest()
    OWNER TO user;