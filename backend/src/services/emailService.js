import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
});

const SUBJECTS = { signup: 'Verify your email', resetPassword: 'Reset your password' };

export const sendCodeEmail = ({ to, code, purpose }) =>
    transporter.sendMail({
        from: `"Zero Hunger" <${process.env.MAIL_USER}>`,
        to,
        subject: `Zero Hunger: ${SUBJECTS[purpose]}`,
        text: `Your code is ${code}. It expires in 10 minutes. If you did not ask for this, ignore this email and do not share the code.`,
    });