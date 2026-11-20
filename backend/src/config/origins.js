const allowedOrigins = [
    'https://zero-hunger-2-wgmf.vercel.app',
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
]
    .filter(Boolean)
    .flatMap((url) => url.split(',').map((origin) => origin.trim()));

if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175');
}

// Development-only: accept loopback and private-network hosts (any port)
const isLocalDevOrigin = (origin) => {
    try {
        const { hostname } = new URL(origin);
        const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

        if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
            return true;
        }

        const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (!ipv4) return false;

        const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
        return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
    } catch {
        return false;
    }
};

const isAllowedOrigin = (origin) =>
    allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin));

export { isAllowedOrigin };