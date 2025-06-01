-- FUNCTION: public.func_outputcsvfile(integer, timestamp without time zone, timestamp without time zone, text)

-- DROP FUNCTION IF EXISTS public.func_outputcsvfile(integer, timestamp without time zone, timestamp without time zone, text);

CREATE OR REPLACE FUNCTION public.func_outputcsvfile(
	sec integer,
	tgt_st timestamp without time zone,
	tgt_ed timestamp without time zone,
	csv_file_path text)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
	-- Day of Week.	(0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat)
	dow		INT;
	-- Day of Week of after change.(1=Sun,Wed,2=Mon,Thu,Sat,3=Tue,Fri)
	chg_dow		INT;
	-- Get record info in a db_cardata_latest.
	last_rec RECORD;
	-- Get column of records in a db_cardata_latest.
	car_shakei	INT;
	car_1num	INT;
	-- Index(=Suffix).
	idx	INT;
	-- Messege.
	msg TEXT;
	-- Csv file name.
	fname	TEXT;
	-- Top/Buttom time of ext-all-range.
	tgt_top	TIMESTAMP(6);
	tgt_btm	TIMESTAMP(6);
	-- Find cursor position.
	pos CURSOR FOR
		SELECT c_car_shakei, c_car_1num
			FROM db_cardata_latest
			WHERE tgt_st <= c_car_time;
BEGIN
--	RAISE INFO ':val1(sec) : %', sec;
--	RAISE INFO ':val2(tgt_st) : %', tgt_st;
--	RAISE INFO ':val3(tgt_ed) : %', tgt_ed;
--	RAISE INFO ':val4(csv_file_path) : %', csv_file_path;

	-- Check parameter.
	IF sec < 1 THEN
		sec := 1;
	END IF;
	IF sec > 86400 THEN
		sec := 86400;
	END IF;
--	RAISE INFO ':re val1(sec) : %', sec;

	-- Day of week of tgt_st.	
	dow := DATE_PART('dow', tgt_st);
--	RAISE INFO 'dow : %', dow;
	-- dow     := Day of Week or before change.(0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat)
	-- ->
	-- chg_dow := Day of Week of after change.(1=Sun,Wed,2=Mon,Thu,Sat,3=Tue,Fri)
	chg_dow := 1;
	IF dow = 0 THEN chg_dow := 1;	END IF;
	IF dow = 1 THEN chg_dow := 2;	END IF;
	IF dow = 2 THEN chg_dow := 3;	END IF;
	IF dow = 3 THEN chg_dow := 1;	END IF;
	IF dow = 4 THEN chg_dow := 2;	END IF;
	IF dow = 5 THEN chg_dow := 3;	END IF;
	IF dow = 6 THEN chg_dow := 2;	END IF;
--	RAISE INFO 'chg_dow : %', chg_dow;

	-- Drop virtual table.
--	DROP TABLE IF EXISTS db_temp;
	-- Create virtual table.
	CREATE TEMPORARY TABLE db_temp (
		c_id bigserial,
		c_car_time timestamp(06) without time zone NOT NULL DEFAULT now(),
		c_car_shakei smallint,
		c_car_1num smallint,
		c_car_data bytea);

	-- Insert from db_cardata_temp_?_?? to virtual table.
	FOR idx IN 0 .. 23 LOOP
		-- Execute table file.		
		EXECUTE format('INSERT INTO db_temp
					SELECT * 
					FROM db_cardata_temp_%s_%s;',
					TEXT(chg_dow),
					to_char(idx, 'FM09') );
	--	RAISE INFO 'db_cardata_temp_%_%', chg_dow, to_char(idx, 'FM09');
	END LOOP;

	-- Init ext-all-range. (from Start/End time to Top/Buttom time.)
	tgt_top := tgt_st;
	tgt_btm := tgt_ed;

	-- Open db_cardata_latest.
	OPEN pos;

	LOOP
		-- Fetch.
		FETCH pos INTO last_rec;
			-- Exit LOOP.
			EXIT WHEN NOT FOUND;

		-- Show calumn info.
		car_shakei := last_rec.c_car_shakei;
		car_1num := last_rec.c_car_1num;
	--	RAISE INFO 'car_shakei,car_1num = %,%', car_shakei, car_1num;	

		-- Init ext-short-range.
		tgt_st := tgt_top;
		tgt_ed := cast(tgt_st as timestamp) + cast(TEXT(sec) as INTERVAL);

		-- Repeat ext-range number of sentences.(max:24hour*60min*60sec=86400)
		FOR idx IN 0 .. (86400 - 1) LOOP

			-- Is tgt_st over time?
			IF tgt_st >= tgt_btm THEN
			--	RAISE INFO 'tgt_st over.';
				-- Break;
				EXIT;
			END IF;
			-- Is tgt_ed over time?
			IF tgt_ed > tgt_btm THEN
				-- Fix tgt_btm to tgt_ed. 
				tgt_ed := tgt_btm;
			END IF;

			-- Make csv file name.
			fname := format('%s\%s\%s\%s\%s_%s.csv',
						TEXT(csv_file_path),
						to_char(car_shakei, 'FM09'),
						to_char(car_1num, 'FM0999'),
						to_char(tgt_st, 'YYYYMMDD'),
						to_char(tgt_st, 'YYYYMMDD'),
						to_char(tgt_st, 'HH24MISS'));
						   
			-- Make CSV file.
			msg := format('COPY (SELECT * FROM db_temp
				WHERE c_car_shakei = %s AND c_car_1num = %s
				AND ''%s'' <= c_car_time AND c_car_time < ''%s'')
				TO ''%s''
				DELIMITER '','' CSV HEADER encoding ''UTF8''',
					TEXT(car_shakei), TEXT(car_1num),
					TEXT(tgt_st), TEXT(tgt_ed),
					TEXT(fname));
			-- Show info.
		--	RAISE INFO '%', msg;
			-- Execute COPY db_temp TO CSV file.
			EXECUTE msg;

			-- Update ext-short-range.
			tgt_st := tgt_ed;
			tgt_ed := cast(tgt_st as timestamp) + cast(TEXT(sec) as INTERVAL);

		END LOOP;
		
	END LOOP;
	
	-- Close db_cardata_latest.
	CLOSE pos;

--	RETURN true;
END
$BODY$;

ALTER FUNCTION public.func_outputcsvfile(integer, timestamp without time zone, timestamp without time zone, text)
    OWNER TO user; 