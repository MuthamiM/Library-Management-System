/** Feature: Auth — handler + DB seeding */
import { json, errorResponse, signJWT, hashPassword, verifyPassword } from '../../shared/utils.js';
import { JWT_SECRET } from '../../shared/auth.middleware.js';
import { seedDatabase } from './auth.seed.js';

export async function handleAuth(request, env, path, method) {
    // POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password) return errorResponse('ID/Email and password required');

        // 1. Try Librarian (users table)
        let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        let role = user ? user.role : null;
        let isMember = false;

        // 2. Try Member (members table)
        if (!user) {
            user = await env.DB.prepare('SELECT * FROM members WHERE member_id = ?').bind(email).first();
            if (user) {
                role = 'member';
                isMember = true;
            }
        }

        if (!user) return errorResponse('Invalid credentials', 401);

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return errorResponse('Invalid credentials', 401);

        const token = await signJWT(
            {
                sub: user.id, name: user.name, email: isMember ? user.member_id : user.email, role: role,
                exp: Math.floor(Date.now() / 1000) + 86400
            },
            JWT_SECRET
        );
        return json({ token, user: { id: user.id, name: user.name, email: isMember ? user.member_id : user.email, role: role, avatar: user.avatar || user.photo || '' } });
    }

    // GET /api/auth/me
    if (path === '/api/auth/me' && method === 'GET') {
        const { verifyToken } = await import('../../shared/auth.middleware.js');
        const auth = await verifyToken(request, env);
        if (!auth.ok) return errorResponse(auth.error, 401);
        const user = await env.DB.prepare('SELECT id,name,email,role,avatar FROM users WHERE id=?')
            .bind(auth.user.sub).first();
        return user ? json(user) : errorResponse('Not found', 404);
    }

    // POST /api/auth/seed — initialize DB with sample data
    if (path === '/api/auth/seed' && method === 'POST') {
        return await seedDatabase(env);
    }

    return errorResponse('Not Found', 404);
}
