import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Admin } from '../src/models/schemas/adminSchema.js';

const [, , name, email] = process.argv;
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password || password.length < 12) {
    console.error('Usage: set ADMIN_PASSWORD (12+ chars), then: node scripts/createAdmin.js "<name>" "<email>"');
    process.exit(1);
}

const run = async () => {
    try {
        await connectDB();

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await Admin.findOne({ email: normalizedEmail });
        if (existing) {
            console.error(`Admin with email ${normalizedEmail} already exists`);
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const admin = await Admin.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            isActive: true,
        });

        console.log(`Admin created successfully: ${admin.name} (${admin.email}) [ID: ${admin._id}]`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Failed to create admin:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

run();

