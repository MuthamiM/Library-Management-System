/** Feature: Auth — Database Seed (all sample data) */
import { json } from '../../shared/utils.js';
import { hashPassword } from '../../shared/utils.js';

export async function seedDatabase(env) {
    const db = env.DB;
    console.log('[Seed] Starting database seed...');

    try {
        // ── Schema (redundant but safe) ──────────────────────────────────
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL, avatar TEXT DEFAULT '',
                role TEXT DEFAULT 'librarian', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
                email TEXT, phone TEXT, photo TEXT DEFAULT '',
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                isbn TEXT UNIQUE, title TEXT NOT NULL, author TEXT NOT NULL,
                category TEXT DEFAULT 'General', cover_url TEXT DEFAULT '',
                total_copies INTEGER DEFAULT 1, available_copies INTEGER DEFAULT 1,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS loans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER NOT NULL REFERENCES members(id),
                book_id INTEGER NOT NULL REFERENCES books(id),
                borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                due_date DATETIME NOT NULL, returned_at DATETIME,
                status TEXT DEFAULT 'active'
            );
            CREATE TABLE IF NOT EXISTS visitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                month INTEGER NOT NULL, year INTEGER NOT NULL,
                count INTEGER DEFAULT 0, UNIQUE(month, year)
            );
        `);

        // ── Data Preparation ──────────────────────────────────────────
        const ph = await hashPassword('admin123');
        const batch = [];

        // Librarian
        batch.push(db.prepare(`INSERT OR IGNORE INTO users (name,email,password_hash,avatar,role) VALUES (?,?,?,?,?)`)
            .bind('EZRA MUTUMA', 'librarian@ezr.com', ph, '', 'librarian'));

        // Members
        const MEMBERS = [
            ['21344123', 'ZOUAK Omar', 'omar.zouak@email.com', '+213 555 0101', ''],
            ['21344124', 'FAROUK Ahmed', 'farouk.ahmed@email.com', '+213 555 0102', ''],
            ['21344125', 'SARA Benali', 'sara.benali@email.com', '+213 555 0103', ''],
            ['21344126', 'KARIM Mansouri', 'karim.m@email.com', '+213 555 0104', ''],
            ['21344127', 'NADIA Cherif', 'nadia.c@email.com', '+213 555 0105', ''],
        ];
        for (const m of MEMBERS) {
            const password = m[3] || 'member123';
            const hashed = await hashPassword(password);
            batch.push(db.prepare(`INSERT OR IGNORE INTO members (member_id,name,email,phone,photo,password_hash) VALUES (?,?,?,?,?,?)`).bind(...m, hashed));
        }

        // Books
        const BOOKS = [
            ['978-0-14-028329-7', 'Seven Brief Lessons on Physics', 'Carlo Rovelli', 'Science', 'https://covers.openlibrary.org/b/id/8739161-M.jpg', 3, 1],
            ['978-0-19-280254-7', 'Quantum Computing for Everyone', 'Chris Bernhardt', 'Technology', 'https://covers.openlibrary.org/b/id/8226636-M.jpg', 2, 0],
            ['978-0-06-112008-4', 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'https://covers.openlibrary.org/b/id/8810494-M.jpg', 5, 4],
            ['978-0-7432-7356-5', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 'https://covers.openlibrary.org/b/id/8257272-M.jpg', 4, 3],
            ['978-0-14-028726-4', 'Brave New World', 'Aldous Huxley', 'Fiction', 'https://covers.openlibrary.org/b/id/8228691-M.jpg', 3, 2],
            ['978-0-374-52970-4', 'Sapiens', 'Yuval Noah Harari', 'History', 'https://covers.openlibrary.org/b/id/8739397-M.jpg', 4, 3],
            ['978-1-59184-272-7', 'Thinking Fast and Slow', 'Daniel Kahneman', 'Psychology', 'https://covers.openlibrary.org/b/id/8235118-M.jpg', 2, 1],
            ['978-0-547-92822-7', 'The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 'https://covers.openlibrary.org/b/id/8406742-M.jpg', 6, 5],
            ['978-0-439-02352-8', 'The Hunger Games', 'Suzanne Collins', 'Action', 'https://covers.openlibrary.org/b/id/8261401-M.jpg', 4, 2],
            ['978-1-4000-3477-2', 'The Kite Runner', 'Khaled Hosseini', 'Fiction', 'https://covers.openlibrary.org/b/id/8425215-M.jpg', 3, 3],
            ['978-0-307-27767-1', 'The Road', 'Cormac McCarthy', 'Sci-Fi', 'https://covers.openlibrary.org/b/id/8243336-M.jpg', 2, 2],
            ['978-0-06-112241-5', 'The Alchemist', 'Paulo Coelho', 'Fiction', 'https://covers.openlibrary.org/b/id/8776165-M.jpg', 8, 6],
            ['978-0-553-29337-1', 'Foundation', 'Isaac Asimov', 'Sci-Fi', 'https://covers.openlibrary.org/b/id/8258388-M.jpg', 3, 3],
            ['978-0-14-303943-3', 'The Grapes of Wrath', 'John Steinbeck', 'Classic', 'https://covers.openlibrary.org/b/id/8232238-M.jpg', 4, 4],
            ['978-0-316-76948-8', 'The Catcher in the Rye', 'J.D. Salinger', 'Classic', 'https://covers.openlibrary.org/b/id/8232930-M.jpg', 5, 5],
            ['978-0-451-52493-5', '1984', 'George Orwell', 'Classic', 'https://covers.openlibrary.org/b/id/8575708-M.jpg', 7, 4],
            ['978-0-618-26030-0', 'The Fellowship of the Ring', 'J.R.R. Tolkien', 'Fantasy', 'https://covers.openlibrary.org/b/id/8235123-M.jpg', 4, 3],
            ['978-0-14-143951-8', 'Pride and Prejudice', 'Jane Austen', 'Classic', 'https://covers.openlibrary.org/b/id/8257125-M.jpg', 6, 6],
            ['978-0-06-440499-0', 'The Lion, the Witch and the Wardrobe', 'C.S. Lewis', 'Children', 'https://covers.openlibrary.org/b/id/8235084-M.jpg', 5, 5],
            ['978-0-307-47427-8', 'The Girl with the Dragon Tattoo', 'Stieg Larsson', 'Mystery', 'https://covers.openlibrary.org/b/id/8235130-M.jpg', 3, 2]
        ];
        for (const b of BOOKS) {
            batch.push(db.prepare(`INSERT OR IGNORE INTO books (isbn,title,author,category,cover_url,total_copies,available_copies) VALUES (?,?,?,?,?,?,?)`).bind(...b));
        }

        // Loans
        const LOANS = [
            [1, 1, '2023-03-18', '2023-03-28', null, 'overdue'],
            [1, 2, '2023-03-15', '2023-03-25', null, 'overdue'],
            [2, 3, '2023-03-10', '2023-03-20', '2023-03-19', 'returned'],
        ];
        for (const l of LOANS) {
            batch.push(db.prepare(`INSERT OR IGNORE INTO loans (member_id,book_id,borrowed_at,due_date,returned_at,status) VALUES (?,?,?,?,?,?)`).bind(...l));
        }

        // Visitors
        const VISITORS = [
            [1, 2023, 220], [2, 2023, 180], [3, 2023, 310], [4, 2023, 275], [5, 2023, 380],
            [6, 2023, 420], [7, 2023, 350], [8, 2023, 290], [9, 2023, 460], [10, 2023, 510],
            [11, 2023, 480], [12, 2023, 390],
        ];
        for (const v of VISITORS) {
            batch.push(db.prepare(`INSERT OR IGNORE INTO visitors (month,year,count) VALUES (?,?,?)`).bind(...v));
        }

        console.log(`[Seed] Executing batch of ${batch.length} statements...`);
        await db.batch(batch);

        console.log('[Seed] Database seeded successfully!');
        return json({ message: 'Database seeded successfully! You can now log in.' });
    } catch (err) {
        console.error('[Seed Error]', err);
        return json({ error: err.message, stack: err.stack }, 500);
    }
}
