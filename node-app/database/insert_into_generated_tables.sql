-- FUNCTION: public.insert_into_generated_tables()

-- DROP FUNCTION IF EXISTS public.insert_into_generated_tables();

CREATE OR REPLACE FUNCTION public.insert_into_generated_tables()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
    table_prefix TEXT;
    table_index_str TEXT; -- テーブル名の数字部分を文字列として宣言
    day_index INT;
BEGIN
    day_index := EXTRACT(DOW FROM (NEW.c_car_time AT TIME ZONE 'Asia/Tokyo'));

    IF day_index IN (1, 4, 6) THEN
        table_prefix := 'temp_2'; -- 月、木、土曜日はtemp_2
    ELSIF day_index IN (2, 5) THEN
        table_prefix := 'temp_3'; -- 火、金曜日はtemp_3
    ELSE
        table_prefix := 'temp_1'; -- 日、水曜日はtemp_1
    END IF;

    -- テーブル名の数字部分を0paddingして2桁でフォーマットする
    table_index_str := lpad(EXTRACT(HOUR FROM NEW.c_car_time)::text, 2, '0');

    EXECUTE format('INSERT INTO public.db_cardata_%I_%s (c_car_time, c_car_shakei, c_car_1num, c_car_data) VALUES ($1.c_car_time, $1.c_car_shakei, $1.c_car_1num, $1.c_car_data);', table_prefix, table_index_str) USING NEW;
    RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.insert_into_generated_tables()
    OWNER TO user;