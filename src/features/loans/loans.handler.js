/** Feature: Loans — borrow, return, overdue, history */
import { json, errorResponse } from '../../shared/utils.js';

export async function handleLoans(request, env, path, method) {
    const db = env.DB;
    const url = new URL(request.url);
    const idMatch = path.match(/^\/api\/loans\/(\d+)(\/return)?$/);
    const loanId = idMatch ? parseInt(idMatch[1]) : null;
    const isReturn = idMatch && idMatch[2] === '/return';
    const memberPath = path.match(/^\/api\/loans\/member\/(\d+)$/);

    // GET /api/loans/overdue
    if (path === '/api/loans/overdue' && method === 'GET') {
        const { results } = await db.prepare(
            `SELECT l.*, m.name as member_name, m.member_id as member_code,
              m.email as member_email, m.phone as member_phone, m.photo as member_photo,
              b.title, b.author, b.cover_url,
              CAST((julianday('now') - julianday(l.due_date)) AS INTEGER) as days_overdue
       FROM loans l
       JOIN members m ON m.id = l.member_id
       JOIN books   b ON b.id = l.book_id
       WHERE l.status = 'overdue'
       ORDER BY days_overdue DESC`
        ).all();
        return json(results);
    }

    // GET /api/loans/member/:memberId
    if (memberPath && method === 'GET') {
        const mid = parseInt(memberPath[1]);
        const { results } = await db.prepare(
            `SELECT l.*, b.title, b.author, b.cover_url
       FROM loans l JOIN books b ON b.id=l.book_id
       WHERE l.member_id=? ORDER BY l.borrowed_at DESC`
        ).bind(mid).all();
        return json(results);
    }

    // GET /api/loans — all loans (paginated)
    if (path === '/api/loans' && method === 'GET') {
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const status = url.searchParams.get('status') || '';

        let q = `SELECT l.*, m.name as member_name, m.member_id as member_code,
                     b.title, b.author, b.cover_url
              FROM loans l
              JOIN members m ON m.id=l.member_id
              JOIN books   b ON b.id=l.book_id`;
        const params = [];
        if (status) { q += ` WHERE l.status=?`; params.push(status); }
        q += ` ORDER BY l.borrowed_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const { results } = await db.prepare(q).bind(...params).all();
        const { n } = await db.prepare('SELECT COUNT(*) as n FROM loans').first();
        return json({ loans: results, total: n, page, limit });
    }

    // POST /api/loans  — create (borrow a book)
    if (path === '/api/loans' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { member_id, book_id, due_date } = body;
        if (!member_id || !book_id || !due_date) return errorResponse('member_id, book_id and due_date are required');

        // Check availability
        const book = await db.prepare('SELECT * FROM books WHERE id=?').bind(book_id).first();
        if (!book) return errorResponse('Book not found', 404);
        if (book.available_copies < 1) return errorResponse('No copies available');

        const r = await db.prepare(
            `INSERT INTO loans (member_id,book_id,due_date,status) VALUES (?,?,?,'active')`
        ).bind(member_id, book_id, due_date).run();

        // Decrease available copies
        await db.prepare('UPDATE books SET available_copies=available_copies-1 WHERE id=?').bind(book_id).run();

        return json({ id: r.meta.last_row_id, member_id, book_id, due_date, status: 'active' }, 201);
    }

    // PUT /api/loans/:id/return  — return book
    if (loanId && isReturn && method === 'PUT') {
        const loan = await db.prepare('SELECT * FROM loans WHERE id=?').bind(loanId).first();
        if (!loan) return errorResponse('Loan not found', 404);
        if (loan.status === 'returned') return errorResponse('Already returned');

        await db.prepare(
            `UPDATE loans SET status='returned', returned_at=datetime('now') WHERE id=?`
        ).bind(loanId).run();
        await db.prepare('UPDATE books SET available_copies=available_copies+1 WHERE id=?').bind(loan.book_id).run();
        return json({ message: 'Book returned successfully' });
    }

    // GET /api/loans/:id
    if (loanId && method === 'GET') {
        const loan = await db.prepare(
            `SELECT l.*, m.name as member_name, b.title, b.author FROM loans l
       JOIN members m ON m.id=l.member_id JOIN books b ON b.id=l.book_id WHERE l.id=?`
        ).bind(loanId).first();
        if (!loan) return errorResponse('Loan not found', 404);
        return json(loan);
    }

    return errorResponse('Not Found', 404);
}
