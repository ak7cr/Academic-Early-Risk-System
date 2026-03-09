-- AREWS: Academic Risk Early-Warning System
-- PostgreSQL / Supabase migration
-- Run this in Supabase SQL Editor to create all tables

-- Enum types
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('student', 'teacher');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE taskstatus AS ENUM ('pending', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE tasktype AS ENUM ('assignment', 'exam', 'task');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE risklevel AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role userrole NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    department VARCHAR(200),
    year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type tasktype NOT NULL DEFAULT 'assignment',
    due_date TIMESTAMPTZ NOT NULL,
    estimated_hours DOUBLE PRECISION DEFAULT 0.0,
    status taskstatus NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Risk History
CREATE TABLE IF NOT EXISTS risk_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_level risklevel NOT NULL,
    completion_rate DOUBLE PRECISION NOT NULL,
    overdue_tasks INTEGER NOT NULL,
    workload_score DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS ix_tasks_student ON tasks (student_id);
CREATE INDEX IF NOT EXISTS ix_tasks_subject ON tasks (subject_id);
CREATE INDEX IF NOT EXISTS ix_subjects_student ON subjects (student_id);
CREATE INDEX IF NOT EXISTS ix_risk_history_student ON risk_history (student_id);
CREATE INDEX IF NOT EXISTS ix_risk_history_computed ON risk_history (computed_at DESC);

-- Enable Row Level Security (optional — can be configured later)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE risk_history ENABLE ROW LEVEL SECURITY;
