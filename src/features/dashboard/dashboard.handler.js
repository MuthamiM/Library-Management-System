/** Feature: Dashboard — stats and chart data */
import { json, errorResponse } from '../../shared/utils.js';

export async function handleDashboard(request, env, path, method) {
    // GET /api/dashboard/stats
    if (path === '/api/dashboard/stats' && method === 'GET') {
        const [borrowedRow, overdueRow, newMembersRow] = await Promise.all([
            env.DB.prepare(`SELECT COUNT(*) as n FROM loans WHERE status='active'`).first(),
            env.DB.prepare(`SELECT COUNT(*) as n FROM loans WHERE status='overdue'`).first(),
            env.DB.prepare(`SELECT COUNT(*) as n FROM members WHERE strftime('%Y-%m',joined_at)=strftime('%Y-%m','now')`).first(),
        ]);

        const now = new Date();
        const visitorRow = await env.DB.prepare(
            `SELECT count FROM visitors WHERE month=? AND year=?`
        ).bind(now.getMonth() + 1, now.getFullYear()).first();

        return json({
            borrowed: borrowedRow?.n ?? 0,
            overdue: overdueRow?.n ?? 0,
            visitors: visitorRow?.count ?? 89,
            new_members: newMembersRow?.n ?? 13,
        });
    }

    // GET /api/dashboard/chart?period=weekly|monthly|yearly
    if (path === '/api/dashboard/chart' && method === 'GET') {
        const period = new URL(request.url).searchParams.get('period') || 'monthly';
        const year = new URL(request.url).searchParams.get('year') || '2023';

        const [loanRows, visitorRows] = await Promise.all([
            env.DB.prepare(
                `SELECT strftime('%m',borrowed_at) as month, COUNT(*) as count
         FROM loans WHERE strftime('%Y',borrowed_at)=?
         GROUP BY month ORDER BY month`
            ).bind(year).all(),
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
