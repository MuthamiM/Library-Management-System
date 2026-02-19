import { verifyJWT } from './utils.js';

const JWT_SECRET = 'ezralms-secret-2024';
export { JWT_SECRET };

export async function verifyToken(request, env) {
    const header = request.headers.get('Authorization') || '';
    if (!header.startsWith('Bearer ')) return { ok: false, error: 'Missing token' };
    try {
        const user = await verifyJWT(header.slice(7), JWT_SECRET);
        return { ok: true, user };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
