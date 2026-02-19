/** Feature: Books — full CRUD */
import { json, errorResponse } from '../../shared/utils.js';

export async function handleBooks(request, env, path, method) {
    const db = env.DB;
    const url = new URL(request.url);
    const idMatch = path.match(/^\/api\/books\/(\d+)$/);
    const bookId = idMatch ? parseInt(idMatch[1]) : null;

    // GET /api/books  — list (search + paginate)
    if (path === '/api/books' && method === 'GET') {
        const search = url.searchParams.get('q') || '';
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const cat = url.searchParams.get('category') || '';

        let query = `SELECT * FROM books WHERE (title LIKE ? OR author LIKE ? OR isbn LIKE ?)`;
        const params = [`%${search}%`, `%${search}%`, `%${search}%`];
        if (cat) { query += ` AND category=?`; params.push(cat); }
        query += ` ORDER BY added_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const { results } = await db.prepare(query).bind(...params).all();
        const { n } = await db.prepare(`SELECT COUNT(*) as n FROM books`).first();
        return json({ books: results, total: n, page, limit });
    }

    // GET /api/books/:id
    if (bookId && method === 'GET') {
        const book = await db.prepare('SELECT * FROM books WHERE id=?').bind(bookId).first();
        if (!book) return errorResponse('Book not found', 404);
        return json(book);
    }

    // POST /api/books  — create
    if (path === '/api/books' && method === 'POST') {
        const b = await request.json().catch(() => ({}));
        if (!b.title || !b.author) return errorResponse('Title and author are required');
        const r = await db.prepare(
            `INSERT INTO books (isbn,title,author,category,cover_url,total_copies,available_copies)
       VALUES (?,?,?,?,?,?,?)`
        ).bind(b.isbn || null, b.title, b.author, b.category || 'General',
            b.cover_url || '', b.total_copies || 1, b.available_copies ?? b.total_copies ?? 1).run();
        return json({ id: r.meta.last_row_id, ...b }, 201);
    }

    // PUT /api/books/:id  — update
    if (bookId && method === 'PUT') {
        const b = await request.json().catch(() => ({}));
        await db.prepare(
            `UPDATE books SET isbn=?,title=?,author=?,category=?,cover_url=?,
       total_copies=?,available_copies=? WHERE id=?`
        ).bind(b.isbn || null, b.title, b.author, b.category || 'General',
            b.cover_url || '', b.total_copies, b.available_copies, bookId).run();
        return json({ message: 'Book updated' });
    }

    // DELETE /api/books/:id
    if (bookId && method === 'DELETE') {
        await db.prepare('DELETE FROM books WHERE id=?').bind(bookId).run();
        return json({ message: 'Book deleted' });
    }

    return errorResponse('Not Found', 404);
}
