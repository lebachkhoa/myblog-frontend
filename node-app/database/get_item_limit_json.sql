-- FUNCTION: public.get_item_limit_json(integer)

-- DROP FUNCTION IF EXISTS public.get_item_limit_json(integer);

CREATE OR REPLACE FUNCTION public.get_item_limit_json(
	p_shakei integer)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
    RETURN (
        SELECT jsonb_object_agg(
            TRIM(c_car_item),
            jsonb_build_object(
                'c_id', c_id,
                'c_car_time', c_car_time,
                'c_car_shakei', c_car_shakei,
                'c_car_1num', c_car_1num,
                'c_hensei_name', encode(c_hensei_name, 'base64'),
				'c_car_item', trim(c_car_item),
                'c_car_item_label', trim(c_car_item_label),
                'c_limit_t_0', c_limit_t_0,
                'c_limit_t_1', c_limit_t_1,
                'c_limit_t_0_1', c_limit_t_0_1,
                'c_limit_t_1_0', c_limit_t_1_0,				
                'c_limit_order', trim(c_limit_order),
                'c_limit_diag', trim(c_limit_diag),
                'c_limit_opt', c_limit_opt,
				'c_view' , c_view,
    			'c_tmsp_preset',c_tmsp_preset,
                'c_systime', c_systime
            )
        )
        FROM (
            SELECT *
            FROM db_item_limit
            WHERE c_car_shakei = p_shakei::smallint  -- 明示的なキャスト
            ORDER BY c_id DESC
        ) sub
    );
END;
$BODY$;

ALTER FUNCTION public.get_item_limit_json(integer)
    OWNER TO user; 