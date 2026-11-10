import transporter from '../config/nodeMailer.js';

// Change these three to match your UI theme
const BRAND = '#2b8a3e';
const BRAND_DARK = '#2e7d32';
const BRAND_LIGHT = '#e8f5e9';

const CONTENT = {
    signup: {
        subject: 'Verify your email',
        title: 'Verify your email',
        message: 'Thanks for joining Zero Hunger. Enter this code to verify your email and start making a difference.',
    },
    resetPassword: {
        subject: 'Reset your password',
        title: 'Reset your password',
        message: 'We received a request to reset your password. Enter this code to choose a new one.',
    },
};

const buildHtml = ({ title, message, code }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background:#f4f6f5; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        Your Zero Hunger code is ${code}. It expires in 10 minutes.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5; padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e3e8e5;">
                    <tr>
                        <td align="center" style="background:${BRAND}; padding:28px 20px;">
                            <div style="font-size:24px; font-weight:bold; color:#ffffff;">Zero Hunger</div>
                            <div style="font-size:13px; color:#d8f0de; margin-top:4px;">Every meal you buy feeds a child</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 28px 8px;">
                            <h1 style="margin:0 0 12px; font-size:22px; color:#1f2d24; text-align:center;">${title}</h1>
                            <p style="margin:0; font-size:15px; line-height:1.6; color:#4a5a50; text-align:center;">${message}</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:24px 28px 8px;">
                            <div style="position:relative; background:${BRAND_LIGHT}; border:2px dashed ${BRAND}; border-radius:10px; padding:18px 12px 24px;">
                                <div style="font-size:12px; color:${BRAND_DARK}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px;">Your code</div>
                                <div id="otp-code" style="font-size:34px; font-weight:bold; letter-spacing:10px; color:${BRAND_DARK}; font-family:'Courier New', monospace;">${code}</div>
                                <button onclick="navigator.clipboard.writeText('${code}'); this.innerText='Copied!'; setTimeout(() => this.innerText='Copy Code', 2000);" style="position:absolute; bottom:8px; right:12px; background:${BRAND}; color:#ffffff; border:none; border-radius:4px; padding:4px 10px; font-size:11px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:0.5px;">Copy Code</button>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:16px 28px 28px;">
                            <p style="margin:0; font-size:14px; color:#4a5a50;">This code expires in <strong>10 minutes</strong>.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 28px;">
                            <div style="background:#fafbfa; border-left:4px solid ${BRAND}; padding:12px 14px; border-radius:4px;">
                                <p style="margin:0; font-size:13px; line-height:1.5; color:#5d6d63;">
                                    Never share this code with anyone. Zero Hunger will never ask you for it.
                                    If you did not request this, you can safely ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:#f4f6f5; padding:18px 20px; border-top:1px solid #e3e8e5;">
                            <p style="margin:0; font-size:12px; color:#8a9a90;">&copy; ${new Date().getFullYear()} Zero Hunger. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

export const sendCodeEmail = async ({ to, code, purpose }) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n========================================`);
        console.log(`[ZeroHunger Email OTP] To: ${to}`);
        console.log(`[ZeroHunger Email OTP] Purpose: ${purpose}`);
        console.log(`[ZeroHunger Email OTP] Code: ${code}`);
        console.log(`========================================\n`);
    }

    const content = CONTENT[purpose];

    return transporter.sendMail({
        from: `"Zero Hunger" <${process.env.MAIL_USER}>`,
        to,
        subject: `Zero Hunger: ${content.subject}`,
        text: `${content.title}\n\nYour code is ${code}. It expires in 10 minutes.\n\nNever share this code. If you did not request this, ignore this email.`,
        html: buildHtml({ ...content, code }),
    });
};