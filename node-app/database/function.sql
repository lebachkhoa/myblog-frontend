-- 2023年から2033年までのデータテーブル、シーケンス、トリガ作成・紐づけを一括で行う
DO $$
DECLARE
    start_year INT := 2023; -- 開始年度
    num_years INT := 10; -- 作成する年数
BEGIN
    FOR i IN 0..num_years-1 LOOP
        -- 年度ごとのテーブル作成
        EXECUTE format('
            CREATE SEQUENCE IF NOT EXISTS public.db_cardata_%s_c_id_seq
            INCREMENT 1
            START 1
            MINVALUE 1
            MAXVALUE 9223372036854775807
            CACHE 1;', start_year + i);

        EXECUTE format('
            CREATE TABLE IF NOT EXISTS public.db_cardata_%s
            (
                c_id bigint NOT NULL DEFAULT nextval(''db_cardata_%s_c_id_seq''::regclass),
                c_car_time timestamp without time zone NOT NULL DEFAULT now(),
                c_car_shakei smallint NOT NULL,
                c_car_1num smallint NOT NULL,
                c_car_data bytea,
                CONSTRAINT db_cardata_%s_pkey PRIMARY KEY (c_id, c_car_shakei, c_car_1num)
            )
            TABLESPACE pg_default;

            ALTER TABLE IF EXISTS public.db_cardata_%s
            OWNER TO user;', start_year + i, start_year + i, start_year + i, start_year + i, start_year + i); 

        -- トリガの作成
        EXECUTE format('
            CREATE TRIGGER insert_into_generated_tables_trigger_%s
            AFTER INSERT ON db_cardata_%s
            FOR EACH ROW
            EXECUTE FUNCTION insert_into_generated_tables();', start_year + i, start_year + i);
    END LOOP;
END $$;



-- db_cardata_temp_1_00～db_cardata_temp_3_23を一括で作成する。
CREATE SEQUENCE IF NOT EXISTS public.db_cardata_temp_c_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

DO $$
DECLARE
    table_prefix TEXT;
    table_index INT;
    table_index_xx TEXT;
    day_index INT;
BEGIN
    FOR day_index IN 1..3 LOOP -- 1から3までの曜日をループ
        table_prefix := CASE
            WHEN day_index IN (1) THEN 'db_cardata_temp_2' -- 月、木、土曜日はテーブル2
            WHEN day_index IN (2) THEN 'db_cardata_temp_3' -- 火、金曜日はテーブル3
            ELSE 'db_cardata_temp_1' -- 日、水曜日はテーブル1
        END;

        FOR table_index IN 0..23 LOOP -- 0から23までのテーブルをループ
	    table_index_xx := lpad(table_index::text, 2, '0');

            EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I_%s (
		    c_id bigint NOT NULL DEFAULT nextval(''public.db_cardata_temp_c_id_seq''::regclass),
		    c_car_time timestamp without time zone NOT NULL DEFAULT now(),
		    c_car_shakei smallint NOT NULL,
		    c_car_1num smallint NOT NULL,
		    c_car_data bytea,
                CONSTRAINT %I_%s_pkey PRIMARY KEY (c_id, c_car_shakei, c_car_1num)
            );', table_prefix, table_index_xx, table_prefix, table_index_xx);
        END LOOP;
    END LOOP;
END $$;

-- db_cardata_temp_1_00～db_cardata_temp_3_23を一括で削除する。DO $$
DECLARE
    table_prefix TEXT;
    table_index INT;
    table_index_xx TEXT;
BEGIN
    FOR table_index IN 0..23 LOOP -- 0から23までのテーブルをループ
	   table_index_xx := lpad(table_index::text, 2, '0');
            EXECUTE format('DROP TABLE IF EXISTS public.db_cardata_temp_1_%s;',  table_index_xx);
    END LOOP;
        FOR table_index IN 0..23 LOOP -- 0から23までのテーブルをループ
	   table_index_xx := lpad(table_index::text, 2, '0');
            EXECUTE format('DROP TABLE IF EXISTS public.db_cardata_temp_2_%s;',  table_index_xx);
    END LOOP;
        FOR table_index IN 0..23 LOOP -- 0から23までのテーブルをループ
	    table_index_xx := lpad(table_index::text, 2, '0');
            EXECUTE format('DROP TABLE IF EXISTS public.db_cardata_temp_3_%s;',  table_index_xx);
    END LOOP;
END $$;
