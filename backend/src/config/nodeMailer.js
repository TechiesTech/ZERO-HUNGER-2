import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: (process.env.MAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    },
});

export default transporter;