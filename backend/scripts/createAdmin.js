import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/schemas/userSchema.js';

const [, , name, email] = process.argv;
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password || password.length < 12) {
    console.error('Set ADMIN_PASSWORD (12+ chars), then: node scripts/createAdmin.js "<name>" "<email>"');
    process.exit(1);
}

try {
    await connectDB();
    const admin = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
        roles: ['admin'],
        status: 'active',
    });
    console.log(`Admin created: ${admin.email} [${admin._id}]`);
} catch (error) {
    console.error('Failed:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.connection.close();
}