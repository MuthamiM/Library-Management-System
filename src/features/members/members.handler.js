/** Feature: Members — full CRUD + borrowed books */
import { json, errorResponse } from '../../shared/utils.js';

export async function handleMembers(request, env, path, method) {
    const db = env.DB;
    const url = new URL(request.url);
    const idMatch = path.match(/^\/api\/members\/(\d+)(\/loans)?$/);
    const memberId = idMatch ? parseInt(idMatch[1]) : null;
    const wantsLoans = idMatch && idMatch[2] === '/loans';

    // GET /api/members/:id/loans — member's loan history
    if (memberId && wantsLoans && method === 'GET') {
        const { results } = await db.prepare(
            `SELECT l.*, b.title, b.author, b.cover_url, m.name as member_name, m.member_id as member_code
       FROM loans l
       JOIN books b ON b.id = l.book_id
       JOIN members m ON m.id = l.member_id
       WHERE l.member_id=? ORDER BY l.borrowed_at DESC`
        ).bind(memberId).all();
        return json(results);
    }

    // GET /api/members  — list (search + paginate)
    if (path === '/api/members' && method === 'GET') {
        const search = url.searchParams.get('q') || '';
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { results } = await db.prepare(
            `SELECT m.*, 
        (SELECT COUNT(*) FROM loans WHERE member_id=m.id AND status='active') as active_loans,
        (SELECT COUNT(*) FROM loans WHERE member_id=m.id AND status='overdue') as overdue_count
       FROM members m
       WHERE m.name LIKE ? OR m.member_id LIKE ? OR m.email LIKE ?
       ORDER BY m.joined_at DESC LIMIT ? OFFSET ?`
        ).bind(`%${search}%`, `%${search}%`, `%${search}%`, limit, offset).all();

        const { n } = await db.prepare('SELECT COUNT(*) as n FROM members').first();
        return json({ members: results, total: n, page, limit });
    }

    // GET /api/members/:id
    if (memberId && method === 'GET') {
        const member = await db.prepare('SELECT * FROM members WHERE id=?').bind(memberId).first();
        if (!member) return errorResponse('Member not found', 404);
        // attach current borrowed books
        const { results: loans } = await db.prepare(
            `SELECT l.*, b.title, b.author, b.cover_url
       FROM loans l JOIN books b ON b.id=l.book_id
       WHERE l.member_id=? AND l.status IN ('active','overdue')
       ORDER BY l.due_date ASC`
        ).bind(memberId).all();
        return json({ ...member, loans });
    }

    // POST /api/members  — create
    if (path === '/api/members' && method === 'POST') {
        const m = await request.json().catch(() => ({}));
        if (!m.name || !m.member_id) return errorResponse('Name and member_id are required');
        const r = await db.prepare(
            `INSERT INTO members (member_id,name,email,phone,photo) VALUES (?,?,?,?,?)`
        ).bind(m.member_id, m.name, m.email || '', m.phone || '', m.photo || '').run();
        return json({ id: r.meta.last_row_id, ...m }, 201);
    }

    // PUT /api/members/:id  — update
    if (memberId && method === 'PUT') {
        const m = await request.json().catch(() => ({}));
        await db.prepare(
            `UPDATE members SET member_id=?,name=?,email=?,phone=?,photo=? WHERE id=?`
        ).bind(m.member_id, m.name, m.email || '', m.phone || '', m.photo || '', memberId).run();
        return json({ message: 'Member updated' });
    }

    // DELETE /api/members/:id
    if (memberId && method === 'DELETE') {
        await db.prepare('DELETE FROM members WHERE id=?').bind(memberId).run();
        return json({ message: 'Member deleted' });
    }

    return errorResponse('Not Found', 404);
}
