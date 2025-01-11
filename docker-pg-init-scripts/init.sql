CREATE SCHEMA wemo;

SET search_path TO wemo;

-- 建立 users 表 (使用者)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,             
    name VARCHAR(50) NOT NULL,         
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,    
    member_id VARCHAR(15), 
    is_agree_privacy BOOLEAN DEFAULT false, 
    is_phone_verified BOOLEAN DEFAULT false, 
    is_license_verified BOOLEAN DEFAULT false, 
    is_active BOOLEAN DEFAULT true, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

COMMENT ON TABLE users IS '使用者資料表';

COMMENT ON COLUMN users.id IS '自動遞增的流水號主鍵';
COMMENT ON COLUMN users.name IS '使用者姓名';
COMMENT ON COLUMN users.phone IS '電話號碼';
COMMENT ON COLUMN users.email IS '電子郵件地址';
COMMENT ON COLUMN users.password IS '用戶帳號的密碼';
COMMENT ON COLUMN users.member_id IS '會員身分證編號，非必填';
COMMENT ON COLUMN users.is_agree_privacy IS '用戶是否同意隱私權條款';
COMMENT ON COLUMN users.is_phone_verified IS '電話是否已驗證';
COMMENT ON COLUMN users.is_license_verified IS '駕照是否已驗證';
COMMENT ON COLUMN users.is_active IS '帳戶是否啟用（軟刪除標記）';
COMMENT ON COLUMN users.created_at IS '帳戶的建立時間';
COMMENT ON COLUMN users.updated_at IS '帳戶的更新時間';

-- 建立 scooter 表 (車輛)
CREATE TYPE scooter_status AS ENUM ('available', 'rented', 'reserved', 'unavailable');
COMMENT ON TYPE scooter_status IS '車輛狀態類型，包含：available（可租借）、rented（已租借）、reserved（已保留）、unavailable（不提供服務）';

CREATE TABLE scooter (
    id SERIAL PRIMARY KEY,            
    plate_number VARCHAR(10) UNIQUE NOT NULL, 
    model VARCHAR(50) NOT NULL,        
    status scooter_status DEFAULT 'available',
    latitude NUMERIC(9, 6),    
    longitude NUMERIC(9, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

COMMENT ON TABLE scooter IS '車輛資料表';

COMMENT ON COLUMN scooter.id IS '自動遞增的流水號主鍵';
COMMENT ON COLUMN scooter.plate_number IS '車牌';
COMMENT ON COLUMN scooter.model IS '車輛的型號';
COMMENT ON COLUMN scooter.status IS '車輛當前的狀態';
COMMENT ON COLUMN scooter.latitude IS '車輛的緯度';
COMMENT ON COLUMN scooter.longitude IS '車輛的經度';
COMMENT ON COLUMN scooter.created_at IS '車輛資料的建立時間';
COMMENT ON COLUMN scooter.updated_at IS '車輛資料的更新時間';

-- 建立 rent 表 (租借記錄)
CREATE TABLE rent (
    id SERIAL PRIMARY KEY,             
    user_id INT NOT NULL,              
    scooter_id INT NOT NULL,           
    start_time TIMESTAMP NOT NULL,     
    end_time TIMESTAMP,               
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES wemo.users (id) ON DELETE CASCADE ON UPDATE RESTRICT, -- FOREIGN KEY: 對應 users.id
    CONSTRAINT fk_scooter FOREIGN KEY (scooter_id) REFERENCES wemo.scooter (id) ON DELETE CASCADE ON UPDATE RESTRICT -- FOREIGN KEY: 對應 scooters.id
);

COMMENT ON TABLE rent IS '車輛租借紀錄表';

COMMENT ON COLUMN rent.id IS '自動遞增的流水號主鍵';
COMMENT ON COLUMN rent.user_id IS '租借user ID';
COMMENT ON COLUMN rent.scooter_id IS '租借scooter ID';
COMMENT ON COLUMN rent.start_time IS '租借開始時間';
COMMENT ON COLUMN rent.end_time IS '租借結束時間';
COMMENT ON COLUMN rent.created_at IS '記錄建立時間';
COMMENT ON COLUMN rent.updated_at IS '記錄更新時間';


-- 定義資料表更新Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為 user 表建立 Trigger
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 為 scooter 表建立 Trigger
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON scooter
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 為 rent 表建立 Trigger
CREATE TRIGGER set_rents_updated_at
BEFORE UPDATE ON rent
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 建立DB測試用假資料
INSERT INTO wemo.users (name, phone, email, password, member_id)
SELECT 
  '阿斯拉_' || i AS name,
  '0900000' || i AS phone,
  'a090000' || i || '@example.com' AS email,
  'test' || i AS password,
  'MEM0' || i AS member_id
FROM generate_series(1, 1000) AS i;


INSERT INTO wemo.scooter (plate_number, model, latitude , longitude )
VALUES
     ('QAL-0001', 'Candy3.0', 30.033964, -50.243683),
     ('EWN-0001', 'i-OneFly', 30.037000, -50.240000);


-- 啟用postgis
CREATE EXTENSION IF NOT EXISTS postgis;
