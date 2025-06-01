-- FUNCTION: public.get_series_itemcount(smallint, smallint)

-- DROP FUNCTION IF EXISTS public.get_series_itemcount(smallint, smallint);

CREATE OR REPLACE FUNCTION public.get_series_itemcount(
	p_car_shakei smallint,
	p_car_1num smallint)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    result JSONB;
BEGIN
    WITH series_data AS (
        SELECT 
            TRIM(c_car_item) as c_car_item,  -- TRIMを追加
            json_build_object(
                'c_0', json_agg(c_0 ORDER BY c_car_time),
                'c_1', json_agg(c_1 ORDER BY c_car_time),
                'c_0_1', json_agg(c_0_1 ORDER BY c_car_time),
                'c_1_0', json_agg(c_1_0 ORDER BY c_car_time),
                't_0', json_agg(t_0 ORDER BY c_car_time),
                't_1', json_agg(t_1 ORDER BY c_car_time),
                't_0_1', json_agg(t_0_1 ORDER BY c_car_time),
                't_1_0', json_agg(t_1_0 ORDER BY c_car_time)
            ) AS series_values,
            min(c_car_time) AS min_time,
            max(c_car_time) AS max_time
        FROM public.db_item_countup
        WHERE c_car_shakei = p_car_shakei 
          AND c_car_1num = p_car_1num
        GROUP BY TRIM(c_car_item)  -- GROUP BYにもTRIMを追加
    ),
    json_dict AS (
        SELECT 
            json_object_agg(c_car_item, series_values) AS series_values,  -- すでにTRIM済みのc_car_itemを使用
            min(min_time) AS min_time,
            max(max_time) AS max_time
        FROM series_data
    )
    SELECT json_build_object(
        'tmsp', current_timestamp,
        'c_car_shakei', p_car_shakei,
        'c_car_1num', p_car_1num,
        'c_car_time_st', min_time,
        'c_car_time_ed', max_time,
        'series', series_values
    )::jsonb 
    INTO result 
    FROM json_dict;
    RETURN result;
END;
$BODY$;

ALTER FUNCTION public.get_series_itemcount(smallint, smallint)
    OWNER TO user; 