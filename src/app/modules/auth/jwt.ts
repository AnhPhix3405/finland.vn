import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signAccessToken(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m") // Access token valid for 15 minutes
        .sign(secret);
}

export async function signRefreshToken(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d") // Refresh token valid for 30 days
        .sign(secret);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

// Admin-specific JWT functions with shorter expiration times
export async function signAdminAccessToken(payload: Record<string, unknown>) {
    return await new SignJWT({ ...payload, role: 'admin' })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m") // Admin access token valid for 15 minutes
        .sign(secret);
}

export async function signAdminRefreshToken(payload: Record<string, unknown>) {
    return await new SignJWT({ ...payload, role: 'admin' })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d") // Admin refresh token valid for 30 days
        .sign(secret);
}
