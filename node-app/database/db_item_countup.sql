-- dang nhap vao postgres voi quyen postgres
sudo -u postgres psql

-- tao database
CREATE DATABASE nodeapp OWNER admin;

-- cap quyen cho user admin
GRANT ALL PRIVILEGES ON DATABASE nodeapp TO admin;

-- ket noi vao database nodeapp
\c nodeapp

-- tao bang countup trong database nodeapp
CREATE TABLE public.db_item_countup (           -- tao bang db_item_countup trong schema public
    c_id bigserial NOT NULL,                    -- khoa tu tang dung bigserial
    c_car_time TIMESTAMP(6) without time zone,  -- thoi gian chinh xac den micro giay (6 chu so sau dau phay), khong kem mui gio
    c_car_shakei smallint NOT NULL,             -- smallint: keu du lieu 2 bytes
    c_car_1num smallint NOT NULL,
    c_car_item character(32) NOT NULL,          -- chuoi co dinh dai 32 ky tu
    c_0 INTEGER NOT NULL,                       -- INTEGER: kieu du lieu 4 bytes
    c_1 INTEGER NOT NULL,
    c_0_1 INTEGER NOT NULL,
    c_1_0 INTEGER NOT NULL,
    t_0 INTEGER NOT NULL,
    t_1 INTEGER NOT NULL,
    t_0_1 INTEGER NOT NULL,
    t_1_0 INTEGER NOT NULL,
    c_system TIMESTAMP(6) without time zone  DEFAULT now(),         -- gia tri mac dinh la thoi gian khi insert
    PRIMARY KEY (c_car_time, c_car_shakei, c_car_1num, c_car_item)  -- khoa chinh, 4 cot nay dinh danh duy nhat 1 ban ghi
);

-- chuyen quyen so huu bang cho user admin (cao hon Grant ... to admin)
ALTER TABLE IF EXISTS public.db_item_countup OWNER to admin;

-- cap quyen cho user admin voi bang db_item_countup (SELECT, INSERT, UPDATE, DELETE)
GRANT ALL PRIVILEGES ON TABLE db_item_countup TO admin;