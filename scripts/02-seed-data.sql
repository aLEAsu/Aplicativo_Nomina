-- Usuario administrador por defecto (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@empresa.com', '$2a$10$rKZLvVZhVVZhVVZhVVZhVeJ8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Administrador Sistema', 'admin'),
('usuario@empresa.com', '$2a$10$rKZLvVZhVVZhVVZhVVZhVeJ8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'Usuario Normal', 'user')
ON CONFLICT (email) DO NOTHING;

-- Empleados de ejemplo
INSERT INTO employees (identification, first_name, last_name, email, phone, position, department, base_salary, hire_date, status) VALUES
('1234567890', 'Juan', 'Pérez', 'juan.perez@empresa.com', '3001234567', 'Desarrollador Senior', 'Tecnología', 5000000, '2023-01-15', 'active'),
('0987654321', 'María', 'González', 'maria.gonzalez@empresa.com', '3009876543', 'Gerente de Recursos Humanos', 'RRHH', 7000000, '2022-06-01', 'active'),
('1122334455', 'Carlos', 'Rodríguez', 'carlos.rodriguez@empresa.com', '3001122334', 'Analista Financiero', 'Finanzas', 4500000, '2023-03-20', 'active'),
('5544332211', 'Ana', 'Martínez', 'ana.martinez@empresa.com', '3005544332', 'Diseñadora UX', 'Tecnología', 4000000, '2023-07-10', 'active')
ON CONFLICT (identification) DO NOTHING;
