TRUNCATE incidents, vulnerabilities, incident_sources, employees, response_measures, incident_vulnerability_links, incident_source_links RESTART IDENTITY CASCADE;

-- 1. Сотрудники
INSERT INTO employees (full_name, position, email, phone, department) VALUES
('Иванов Алексей Петрович', 'Инженер SOC', 'ivanov@telecom.ru', '+79991234567', 'Отдел мониторинга'),
('Смирнова Елена Ильинична', 'Аналитик киберугроз', 'smirnova@telecom.ru', '+79997654321', 'Отдел аналитики');

-- 2. Уязвимости
INSERT INTO vulnerabilities (vulnerability_type, software_version, system_name, patch_status, threat_level) VALUES
('CVE-2021-44228 (Log4Shell)', '2.14.1', 'Billing Server', 'InProgress', 5),
('SQL Injection', 'v1.0', 'Customer Portal', 'Fixed', 4),
('Уязвимость в протоколе SS7', 'Core', 'Telecom Switch', 'Open', 5),
('Открытый порт 22 (SSH)', 'OpenSSH 7.2', 'Router Cisco', 'Open', 3);

-- 3. Источники атак (РЕАЛЬНЫЕ ПУБЛИЧНЫЕ IP ИЗ РАЗНЫХ СТРАН ДЛЯ КАРТЫ)
-- 3. Источники атак
INSERT INTO incident_sources (source_name, source_type, ip_address, device_name, contact_info) VALUES
('Внешний ботнет', 'Device', '114.114.114.114', 'Unknown Router', 'ISP: China Telecom'),
('Скомпрометированный сервер', 'System', '8.8.8.8', 'AWS EC2', 'AWS Abuse'),
('Неизвестный инсайдер', 'Person', '95.108.130.130', 'Телефон', 'Аноним'),
('Майнер-сеть', 'Device', '177.10.20.30', 'IoT Camera', 'ISP: Claro'),
('DDoS-Амплификатор', 'System', '5.9.10.11', 'Hetzner Server', 'Abuse Contact'),
('Брутфорс скрипт', 'System', '133.1.2.3', 'VPS', 'ISP: KDDI');

-- 4. Инциденты
INSERT INTO incidents (name, description, type, protocol, threat_level, status, created_by, created_at) VALUES
('Массированный SYN-Flood на биллинг', 'Зафиксирован аномальный всплеск трафика.', 'Внешняя', 'HTTPS', 4, 'Активна', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP - INTERVAL '2 days'),
('Утечка данных через SQLi', 'Обнаружены подозрительные запросы UNION SELECT.', 'Внешняя', 'HTTP', 5, 'Заблокирована', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP - INTERVAL '5 days'),
('Попытка перехвата SMS через SS7', 'Попытка обновления HLR с зарубежного узла.', 'Внешняя', 'SS7', 5, 'Активна', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP),
('Брутфорс SSH роутера', 'Более 500 попыток подбора пароля к маршрутизатору.', 'Внешняя', 'SSH', 3, 'Активна', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP - INTERVAL '1 days'),
('Сканирование портов базы данных', 'Множественные SYN-пакеты на порт 5432.', 'Внешняя', 'TCP', 2, 'Закрыта', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP - INTERVAL '10 days'),
('Майнинг вирус в корпоративной сети', 'Зафиксированы обращения к пулам майнинга.', 'Внешняя', 'TCP', 4, 'Активна', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP - INTERVAL '3 days');

-- 5. Связи
INSERT INTO incident_vulnerability_links (incident_id, vulnerability_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4);

INSERT INTO incident_source_links (incident_id, source_id) VALUES
(1, 1), -- DDoS из Китая
(2, 2), -- SQLi из США
(3, 3), -- SS7 из России
(4, 4), -- Брутфорс из Бразилии
(5, 5), -- Сканирование из Германии
(6, 6); -- Майнинг из Японии