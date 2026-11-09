import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

const phone10 = (value) => (value ? String(value).replace(/\D/g, '').slice(-10) : undefined);
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== ''));

const riderStatus = (doc) => {
    if (doc.isDeleted || doc.isActive === false) return 'suspended';
    if (doc.approvalStatus === 'pending') return 'pending';
    if (doc.approvalStatus === 'rejected') return 'rejected';
    return 'active';
};

const activeStatus = (doc) => (doc.isActive === false ? 'suspended' : 'active');

const SOURCES = [
    { collection: 'admins', role: 'admin', status: activeStatus },
    { collection: 'kitchens', role: 'kitchen', status: activeStatus },
    { collection: 'riders', role: 'rider', status: riderStatus },
    { collection: 'customers', role: 'customer', status: activeStatus },
];

const migrate = async () => {
    await connectDB();
    const users = mongoose.connection.collection('users');

    for (const { collection, role, status } of SOURCES) {
        const docs = await mongoose.connection.collection(collection).find({}).toArray();
        const operations = docs.map((doc) => ({
            updateOne: {
                filter: { _id: doc._id },
                update: {
                    $setOnInsert: clean({
                        name: doc.name,
                        email: doc.email ? String(doc.email).trim().toLowerCase() : undefined,
                        phone: phone10(doc.phone),
                        passwordHash: doc.passwordHash,
                        roles: [role],
                        status: status(doc),
                        rejectionReason: doc.rejectionReason,
                        mustChangePassword: Boolean(doc.mustChangePassword),
                        tokenVersion: doc.tokenVersion || 0,
                        failedLoginAttempts: doc.failedLoginAttempts || 0,
                        lockedUntil: doc.lockedUntil || null,
                        createdAt: doc.createdAt || new Date(),
                        updatedAt: new Date(),
                    }),
                },
                upsert: true,
            },
        }));

        if (!operations.length) continue;

        try {
            const result = await users.bulkWrite(operations, { ordered: false });
            console.log(
                `${collection}: ${result.upsertedCount} copied, ${docs.length - result.upsertedCount} already present`
            );
        } catch (error) {
            process.exitCode = 1;
            const writeErrors = error.writeErrors?.map(({ errmsg }) => errmsg);
            console.error(`${collection}: migration had write errors:`, writeErrors || error.message);
        }
    }

    await users.createIndex(
        { email: 1 },
        { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
    );
    await users.createIndex(
        { phone: 1 },
        { unique: true, partialFilterExpression: { phone: { $type: 'string' } } }
    );
};

try {
    await migrate();
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
} finally {
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
}
