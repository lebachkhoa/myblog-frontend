-- FUNCTION: public.set_c_hensei_name()

-- DROP FUNCTION IF EXISTS public.set_c_hensei_name();

CREATE OR REPLACE FUNCTION public.set_c_hensei_name()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    -- db_formlistテーブル用の処理
    IF TG_TABLE_NAME = 'db_formlist' THEN
        SELECT c_hensei_name
        INTO NEW.c_hensei_name
        FROM public.tbl_dsp_online
        WHERE c_car_shakei = NEW.shakei AND c_car_1num = NEW.shaban;
        
    -- troublelistテーブル用の処理
    ELSIF TG_TABLE_NAME = 'troublelist' THEN
        SELECT c_hensei_name
        INTO NEW.c_hensei_name
        FROM public.tbl_dsp_online
        WHERE c_car_shakei = NEW.c_trb_shakei AND c_car_1num = NEW.c_trb_1num;

    -- 上記以外のテーブルに対する共通処理
    ELSE
        SELECT c_hensei_name
        INTO NEW.c_hensei_name
        FROM public.tbl_dsp_online
        WHERE c_car_shakei = NEW.c_car_shakei AND c_car_1num = NEW.c_car_1num;
    END IF;

    -- `c_hensei_name` が取得できなかった場合、`c_car_shakei` を前方0埋めした4桁文字列に設定
    IF NOT FOUND THEN
	    NEW.c_hensei_name := lpad(NEW.c_car_1num::text, 4, '0');
    END IF;

    RETURN NEW;
END;
$BODY$;

ALTER FUNCTION public.set_c_hensei_name()
    OWNER TO user;