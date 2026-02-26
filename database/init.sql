-- database/init.sql
-- Task Board Schema + Sample Data

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, status, priority) VALUES
    ('ออกแบบ Database Schema', 'สร้าง ER Diagram สำหรับ Task Board', 'DONE', 'HIGH'),
    ('สร้าง REST API', 'Implement CRUD endpoints ด้วย Express.js', 'IN_PROGRESS', 'HIGH'),
    ('สร้าง Frontend UI', 'Kanban board interface', 'TODO', 'MEDIUM'),
    ('เขียน Unit Tests', 'Test coverage > 80%', 'TODO', 'LOW'),
    ('ตั้งค่า Docker', 'Docker Compose สำหรับ development', 'DONE', 'MEDIUM'),
    ('เพิ่ม Redis Cache', 'Cache frequently accessed data', 'IN_PROGRESS', 'HIGH'),
    ('ตั้งค่า Load Balancer', 'Nginx round-robin', 'TODO', 'MEDIUM');
