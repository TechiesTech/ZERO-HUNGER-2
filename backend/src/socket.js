import { Server } from 'socket.io';
import { AUTH_COOKIE } from './utils/authCookie.js';
import { verifyToken } from './services/authService.js';
import { isAllowedOrigin } from './config/origins.js';

// Reads the Cookie header into an object, so no extra package is needed
const parseCookies = (header = '') =>
    Object.fromEntries(
        header
            .split(';')
            .map((part) => {
                const index = part.indexOf('=');
                if (index < 0) return null;

                const key = part.slice(0, index).trim();
                let value = part.slice(index + 1).trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                try {
                    value = decodeURIComponent(value);
                } catch {
                    // keep the raw value if it cannot be decoded
                }
                return [key, value];
            })
            .filter(Boolean)
    );

let io = null;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
            credentials: true,
        },
        // The login cookie is sent automatically, so a foreign website must not be able to connect
        // with a visitor's cookie. This check also covers the WebSocket upgrade, where CORS does not apply.
        allowRequest: (req, callback) => {
            const { origin } = req.headers;
            callback(null, !origin || isAllowedOrigin(origin));
        },
    });

    // Same login check as the API: the token comes from the cookie
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie || '');
            if (!cookies[AUTH_COOKIE]) return next();
            const user = await verifyToken(cookies[AUTH_COOKIE]);
            if (user.mustChangePassword) return next(new Error('Change your password first'));

            socket.data.user = { id: String(user._id), roles: user.roles };
            return next();
        } catch {
            return next(new Error('Not authenticated'));
        }
    });

    io.on('connection', (socket) => {
        socket.join('public:meals');
        if (!socket.data.user) return;
        const { id, roles } = socket.data.user;
        socket.join(`user:${id}`); // customer, kitchen or rider private room
        roles.forEach((role) => socket.join(`role:${role}`)); // role:admin, role:rider ...
    });

    return io;
};

const closeSocket = (done) => {
    if (io) io.close(done); // also closes the HTTP server
    else if (done) done();
};

// A socket problem must never break an API request
const emit = (room, event, payload) => {
    try {
        io?.to(room).emit(event, payload);
    } catch (error) {
        console.error(`Socket emit failed (${event}):`, error.message);
    }
};

const toUser = (userId, event, payload) => emit(`user:${userId}`, event, payload);
const toRole = (role, event, payload) => emit(`role:${role}`, event, payload);
const toPublicMeals = (event, payload) => emit('public:meals', event, payload);

const notifyMealAvailability = (meal) => {
    toPublicMeals('meal-availability', {
        mealId: String(meal._id),
        isAvailable: Boolean(meal.isAvailable),
        unavailableReason: meal.unavailableReason || '',
        at: new Date().toISOString(),
    });
};

// A new order: only its own kitchen, plus admins
const notifyNewOrder = (order) => {
    const payload = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.customerMealStatus,
        totalAmountInr: order.totalAmountInr,
        createdAt: order.createdAt,
        items: (order.items || []).map(({ productName, quantity }) => ({ productName, quantity })),
    };
    toUser(order.kitchenId, 'new-order', payload);
    toRole('admin', 'new-order', payload);
};

// Any status change: the customer, the kitchen of that order, and admins
const notifyOrderStatus = ({ orderNumber, status, deliveryStatus, customerId, kitchenId }) => {
    const payload = { orderNumber, status, deliveryStatus: deliveryStatus || null, at: new Date().toISOString() };
    if (customerId) toUser(customerId, 'order-status', payload);
    if (kitchenId) toUser(kitchenId, 'order-status', payload);
    toRole('admin', 'order-status', payload);
};

// Riders: an order is open for acceptance (the app reloads getAvailableOrders)
const notifyOrderReady = (orderNumber) => toRole('rider', 'order-ready', { orderNumber });

// Riders: another rider took it (the app removes it from the list)
const notifyOrderTaken = (orderNumber) => toRole('rider', 'order-taken', { orderNumber });

// Admins: a new rider is waiting for approval
const notifyRiderRegistered = (rider) =>
    toRole('admin', 'rider-registered', { name: rider.name, email: rider.email, status: rider.status });

export {
    initSocket,
    closeSocket,
    notifyNewOrder,
    notifyOrderStatus,
    notifyOrderReady,
    notifyOrderTaken,
    notifyRiderRegistered,
    notifyMealAvailability,
};