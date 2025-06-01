-- FUNCTION: public.get_series_data(integer, integer)

-- DROP FUNCTION IF EXISTS public.get_series_data(integer, integer);

CREATE OR REPLACE FUNCTION public.get_series_data(
	p_car_shakei integer,
	p_car_1num integer)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    query TEXT;
    result JSONB;
    min_time TIMESTAMP;
    max_time TIMESTAMP;
BEGIN
    -- 最初と最後のタイムスタンプを取得
    query := '
        SELECT MIN(c_car_time), MAX(c_car_time)
        FROM db_item_countup
        WHERE c_car_shakei = $1 AND c_car_1num = $2';
    
    EXECUTE query INTO min_time, max_time USING p_car_shakei, p_car_1num;

    -- メインのクエリ
    query := '
        WITH series_data AS (
            SELECT 
                c_car_item,
                json_build_object(
                    ''series'',
                    json_agg(
                        CASE 
                            WHEN c_0 IS NOT NULL THEN json_build_object(
                                ''data'', c_0
                            )
                            WHEN c_1 IS NOT NULL THEN json_build_object(
                                ''data'', c_1
                            )
                            WHEN c_0_1 IS NOT NULL THEN json_build_object(
                                ''data'', c_0_1
                            )
                            WHEN c_1_0 IS NOT NULL THEN json_build_object(
                                ''data'', c_1_0
                            )
                            WHEN t_0 IS NOT NULL THEN json_build_object(
                                ''data'', t_0
                            )
                            WHEN t_1 IS NOT NULL THEN json_build_object(
                                ''data'', t_1
                            )
                            WHEN t_0_1 IS NOT NULL THEN json_build_object(
                                ''data'', t_0_1
                            )
                            WHEN t_1_0 IS NOT NULL THEN json_build_object(
                                ''data'', t_1_0
                            )
                        END
                        ORDER BY c_car_time
                    )
                ) as series_values
            FROM db_item_countup t
            WHERE c_car_shakei = $1 
                AND c_car_1num = $2
            GROUP BY c_car_item
        ),
        json_dict AS (
            SELECT json_object_agg(
                c_car_item, 
                series_values
            ) as result
            FROM series_data
        )
        SELECT result::jsonb FROM json_dict';
    
    EXECUTE query INTO result USING p_car_shakei, p_car_1num;

    -- 出力データにメタ情報を追加
    RETURN jsonb_build_object(
        'tmsp', now(),
        'c_car_shakei', p_car_shakei,
        'c_car_1num', p_car_1num,
        'c_car_time_st', min_time,
        'c_car_time_ed', max_time,
        'series', result
    );
END;
$BODY$;

ALTER FUNCTION public.get_series_data(integer, integer)
    OWNER TO user; 