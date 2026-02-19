/** Feature: Auth — handler + DB seeding */
import { json, errorResponse, signJWT, hashPassword, verifyPassword } from '../../shared/utils.js';
import { JWT_SECRET } from '../../shared/auth.middleware.js';
import { seedDatabase } from './auth.seed.js';

export async function handleAuth(request, env, path, method) {
    // POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password) return errorResponse('Email and password required');

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) return errorResponse('Invalid credentials', 401);

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return errorResponse('Invalid credentials', 401);

        const token = await signJWT(
            {
                sub: user.id, name: user.name, email: user.email, role: user.role,
                exp: Math.floor(Date.now() / 1000) + 86400
            },
            JWT_SECRET
        );
        return json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
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
