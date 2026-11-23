PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE COLLATE NOCASE,
    phone VARCHAR(20) NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT,
    name_habit VARCHAR(50) NOT NULL,
    color TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'skipped')),
    habit_id INTEGER NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE (habit_id, record_date)
);

CREATE TABLE IF NOT EXISTS time_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_time VARCHAR(50) NOT NULL,
    color TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (id, user_id),
    UNIQUE (user_id, name_time)
);

CREATE TABLE IF NOT EXISTS time_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    planned_seconds INTEGER NOT NULL CHECK (planned_seconds > 0),
    actual_seconds INTEGER NOT NULL DEFAULT 0 CHECK (actual_seconds >= 0),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'interrupted')),
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id, user_id) REFERENCES time_categories(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_records_habit ON habit_records(habit_id);
CREATE INDEX IF NOT EXISTS idx_time_records_user ON time_records(user_id);