/** Feature: Dashboard — stats and chart data */
import { json, errorResponse } from '../../shared/utils.js';
import { verifyToken } from '../../shared/auth.middleware.js';

export async function handleDashboard(request, env, path, method) {
    // GET /api/dashboard/stats
    if (path === '/api/dashboard/stats' && method === 'GET') {
        const auth = await verifyToken(request, env);
        if (!auth.ok) return errorResponse(auth.error, 401);

        let borrowedQ = `SELECT COUNT(*) as n FROM loans WHERE status='active'`;
        let overdueQ = `SELECT COUNT(*) as n FROM loans WHERE status='overdue'`;
        let membersQ = `SELECT COUNT(*) as n FROM members WHERE strftime('%Y-%m',joined_at)=strftime('%Y-%m','now')`;

        const params = [];
        if (auth.user.role === 'member') {
            borrowedQ += ` AND member_id=?`;
            overdueQ += ` AND member_id=?`;
            params.push(auth.user.sub);
        }

        const [borrowedRow, overdueRow, newMembersRow] = await Promise.all([
            env.DB.prepare(borrowedQ).bind(...params).first(),
            env.DB.prepare(overdueQ).bind(...params).first(),
            auth.user.role === 'librarian'
                ? env.DB.prepare(membersQ).first()
                : Promise.resolve({ n: 0 }),
        ]);

        const now = new Date();
        const visitorRow = await env.DB.prepare(
            `SELECT count FROM visitors WHERE month=? AND year=?`
        ).bind(now.getMonth() + 1, now.getFullYear()).first();

        return json({
            borrowed: borrowedRow?.n ?? 0,
            overdue: overdueRow?.n ?? 0,
            visitors: visitorRow?.count ?? 89,
            new_members: auth.user.role === 'librarian' ? (newMembersRow?.n ?? 13) : 0,
        });
    }

    // GET /api/dashboard/chart?period=weekly|monthly|yearly
    if (path === '/api/dashboard/chart' && method === 'GET') {
        const auth = await verifyToken(request, env);
        if (!auth.ok) return errorResponse(auth.error, 401);

        const period = new URL(request.url).searchParams.get('period') || 'monthly';
        const year = new URL(request.url).searchParams.get('year') || '2023';

        let loanQ = `SELECT strftime('%m',borrowed_at) as month, COUNT(*) as count
                     FROM loans WHERE strftime('%Y',borrowed_at)=?`;
        const loanParams = [year];
        if (auth.user.role === 'member') {
            loanQ += ` AND member_id=?`;
            loanParams.push(auth.user.sub);
        }
        loanQ += ` GROUP BY month ORDER BY month`;

        const [loanRows, visitorRows] = await Promise.all([
            env.DB.prepare(loanQ).bind(...loanParams).all(),
            env.DB.prepare(
                `SELECT month, count FROM visitors WHERE year=? ORDER BY month`
            ).bind(Number(year)).all(),
        ]);

        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const bMap = Object.fromEntries((loanRows.results || []).map(r => [r.month, r.count]));
        const vMap = Object.fromEntries((visitorRows.results || []).map(r => [String(r.month).padStart(2, '0'), r.count]));

        return json({
            period,
            year,
            data: months.map(m => ({ month: m, borrowers: bMap[m] ?? 0, visitors: vMap[m] ?? 0 })),
        });
    }

    return errorResponse('Not Found', 404);
}
