/**
 * EZRAlms — Cloudflare Worker Entry Point
 * Feature-First Architecture
 */
import { handleAuth } from './features/auth/auth.handler.js';
import { handleDashboard } from './features/dashboard/dashboard.handler.js';
import { handleBooks } from './features/books/books.handler.js';
import { handleMembers } from './features/members/members.handler.js';
import { handleLoans } from './features/loans/loans.handler.js';
import { verifyToken } from './shared/auth.middleware.js';
import { corsHeaders, errorResponse } from './shared/utils.js';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // ── CORS preflight ─────────────────────────────────────
        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        try {
            // ── Public routes (no auth) ─────────────────────────
            if (path.startsWith('/api/auth')) {
                return await handleAuth(request, env, path, method);
            }

            // ── Serve frontend static (non /api) ────────────────
            if (!path.startsWith('/api/')) {
                if (env.ASSETS) return env.ASSETS.fetch(request);
                return new Response('Not Found', { status: 404 });
            }

            // ── JWT guard for all /api/* routes ─────────────────
            const auth = await verifyToken(request, env);
            if (!auth.ok) return errorResponse(auth.error, 401);
            request.user = auth.user;

            // ── Feature routing ─────────────────────────────────
            if (path.startsWith('/api/dashboard')) return await handleDashboard(request, env, path, method);
            if (path.startsWith('/api/books')) return await handleBooks(request, env, path, method);
            if (path.startsWith('/api/members')) return await handleMembers(request, env, path, method);
            if (path.startsWith('/api/loans')) return await handleLoans(request, env, path, method);

            return errorResponse('Not Found', 404);
        } catch (err) {
            console.error('[Worker]', err);
            return errorResponse('Internal Server Error: ' + err.message, 500);
        }
    },
};
