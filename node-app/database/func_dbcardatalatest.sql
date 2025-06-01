-- FUNCTION: public.func_dbcardatalatest(text)

-- DROP FUNCTION IF EXISTS public.func_dbcardatalatest(text);

CREATE OR REPLACE FUNCTION public.func_dbcardatalatest(
	csv_file_path text)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
	-- Messege.
	msg TEXT;
BEGIN
--	RAISE INFO ':val1(csv_file_path) : %', csv_file_path;

	-- Make CSV file.
	msg := format('COPY (SELECT c_car_shakei, c_car_1num
			FROM db_cardata_latest)
			TO ''%s''
			DELIMITER '','' encoding ''UTF8''',
				TEXT(csv_file_path));
	-- Show info.
--	RAISE INFO '%', msg;
	-- Execute COPY db_cardata_latest TO CSV file.
	EXECUTE msg;

--	RETURN true;
END
$BODY$;

ALTER FUNCTION public.func_dbcardatalatest(text)
    OWNER TO user; 