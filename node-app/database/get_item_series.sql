-- FUNCTION: public.get_item_series(text, smallint, smallint, timestamp without time zone)

-- DROP FUNCTION IF EXISTS public.get_item_series(text, smallint, smallint, timestamp without time zone);

CREATE OR REPLACE FUNCTION public.get_item_series(
	p_table_name text,
	p_car_shakei smallint,
	p_car_1num smallint,
	p_request_time timestamp without time zone DEFAULT now())
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    result jsonb;
    v_start_time timestamp;
    v_end_time timestamp;
BEGIN
    -- Get start and end times
    EXECUTE format(
        'SELECT 
            min(c_car_time), 
            max(c_car_time)
        FROM %I 
        WHERE c_car_shakei = $1 
        AND c_car_1num = $2',
        p_table_name
    ) INTO v_start_time, v_end_time
    USING p_car_shakei, p_car_1num;

    -- Main query to generate the series data
    WITH series_data AS (
        SELECT 
            c_car_item,
            json_build_object(
                'c_0', json_build_object(
                    'data', json_agg(c_0 ORDER BY c_car_time)
                ),
                'c_1', json_build_object(
                    'data', json_agg(c_1 ORDER BY c_car_time)
                ),
                'c_0_1', json_build_object(
                    'data', json_agg(c_0_1 ORDER BY c_car_time)
                ),
                't_0', json_build_object(
                    'data', json_agg(t_0 ORDER BY c_car_time)
                ),-- FUNCTION: public.get_item_series(text, smallint, smallint, timestamp without time zone)

-- DROP FUNCTION IF EXISTS public.get_item_series(text, smallint, smallint, timestamp without time zone);

CREATE OR REPLACE FUNCTION public.get_item_series(
	p_table_name text,
	p_car_shakei smallint,
	p_car_1num smallint,
	p_request_time timestamp without time zone DEFAULT now())
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    result jsonb;
    v_start_time timestamp;
    v_end_time timestamp;
BEGIN
    -- Get start and end times
    EXECUTE format(
        'SELECT 
            min(c_car_time), 
            max(c_car_time)
        FROM %I 
        WHERE c_car_shakei = $1 
        AND c_car_1num = $2',
        p_table_name
    ) INTO v_start_time, v_end_time
    USING p_car_shakei, p_car_1num;

    -- Main query to generate the series data
    WITH series_data AS (
        SELECT 
            c_car_item,
            json_build_object(
                'c_0', json_build_object(
                    'data', json_agg(c_0 ORDER BY c_car_time)
                ),
                'c_1', json_build_object(
                    'data', json_agg(c_1 ORDER BY c_car_time)
                ),
                'c_0_1', json_build_object(
                    'data', json_agg(c_0_1 ORDER BY c_car_time)
                ),
                't_0', json_build_object(
                    'data', json_agg(t_0 ORDER BY c_car_time)
                ),
                't_1', json_build_object(
                    'data', json_agg(t_1 ORDER BY c_car_time)
                ),
                't_0_1', json_build_object(
                    'data', json_agg(t_0_1 ORDER BY c_car_time)
                ),
                'c_1_0', json_build_object(
                    'data', json_agg(c_1_0 ORDER BY c_car_time)
                )
            ) as series_values
        FROM (
            SELECT *
            FROM (SELECT * FROM db_item_countup
                  WHERE c_car_shakei = p_car_shakei 
                  AND c_car_1num = p_car_1num
                  ORDER BY c_car_time) sorted_data
        ) base_data
        GROUP BY c_car_item
    )
    SELECT jsonb_build_object(
        'tmsp', p_request_time,
        'c_car_shakei', p_car_shakei,
        'c_car_1num', p_car_1num,
        'c_car_time_st', v_start_time,
        'c_car_time_ed', v_end_time,
        'series', (
            SELECT jsonb_object_agg(
                c_car_item,
                series_values
            )
            FROM series_data
        )
    ) INTO result;

    RETURN result;
END;
$BODY$;

ALTER FUNCTION public.get_item_series(text, smallint, smallint, timestamp without time zone)
    OWNER TO user;
                't_1', json_build_object(
                    'data', json_agg(t_1 ORDER BY c_car_time)
                ),
                't_0_1', json_build_object(
                    'data', json_agg(t_0_1 ORDER BY c_car_time)
                ),
                'c_1_0', json_build_object(
                    'data', json_agg(c_1_0 ORDER BY c_car_time)
                )
            ) as series_values
        FROM (
            SELECT *
            FROM (SELECT * FROM db_item_countup
                  WHERE c_car_shakei = p_car_shakei 
                  AND c_car_1num = p_car_1num
                  ORDER BY c_car_time) sorted_data
        ) base_data
        GROUP BY c_car_item
    )
    SELECT jsonb_build_object(
        'tmsp', p_request_time,
        'c_car_shakei', p_car_shakei,
        'c_car_1num', p_car_1num,
        'c_car_time_st', v_start_time,
        'c_car_time_ed', v_end_time,
        'series', (
            SELECT jsonb_object_agg(
                c_car_item,
                series_values
            )
            FROM series_data
        )
    ) INTO result;

    RETURN result;
END;
$BODY$;

ALTER FUNCTION public.get_item_series(text, smallint, smallint, timestamp without time zone)
    OWNER TO user;