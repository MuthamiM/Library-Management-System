-- EZRAlms Library Management System Database Schema

-- Librarian/Staff users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'librarian',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Library members (borrowers)
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo TEXT DEFAULT '',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Book catalog
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn TEXT UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  cover_url TEXT DEFAULT '',
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loan records (borrow / return)
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  returned_at DATETIME,
  status TEXT DEFAULT 'active',
  CHECK (status IN ('active', 'returned', 'overdue'))
);

-- Monthly visitor log
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(month, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
