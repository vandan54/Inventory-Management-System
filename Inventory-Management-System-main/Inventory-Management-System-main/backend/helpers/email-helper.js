require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generic method to handle the actual sending
const sendMail = async (recipientEmail, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: recipientEmail,
            subject: subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        return { status: true, message: "mail sended" };
    } catch (err) {
        console.error('Email sending error,', err);
        return { status: false, message: "Failed to send mail." };
    }
};

// Mail 1: Password Reset
const sendPasswordResetMail = async (recipientEmail, token) => {
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    const subject = "Password Reset Request";
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 500px; margin: 0 auto; padding: 0; }
                .header { background-color: #4f63d2; color: white; padding: 30px 20px; text-align: center; }
                .header h2 { margin: 0; font-size: 24px; }
                .content { background-color: #ffffff; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
                .footer { background-color: #f0f0f0; padding: 15px 20px; text-align: center; font-size: 12px; color: #666; border: 1px solid #ddd; border-top: none; }
                .button { display: inline-block; background-color: #4f63d2; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
                .button:hover { background-color: #3a4eb8; }
                .warning { color: #d9534f; font-weight: bold; }
                .divider { border-top: 1px solid #ddd; margin: 20px 0; }
                p { margin: 10px 0; color: #333; font-size: 14px; }
                ul { margin: 10px 0; padding-left: 20px; font-size: 14px; }
                li { margin: 8px 0; color: #333; }
                .test-notice { font-size: 11px; color: #888; text-align: center; font-style: italic; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Password Reset Request</h2>
                </div>

                <div class="content">
                    <p>Hello,</p>

                    <p>We received a request to reset your password for your account. If you did not make this request, please ignore this email.</p>

                    <p>To reset your password, click the button below:</p>

                    <center>
                        <a href="${resetLink}"><div class="button">Reset Password</div></a>
                    </center>

                    <div class="divider"></div>

                    <p><span class="warning">⚠️ Important:</span></p>
                    <ul>
                        <li>This link expires in <strong>5 minutes</strong></li>
                        <li>Do not share this link with anyone</li>
                        <li>If you did not request this, please ignore this email</li>
                    </ul>

                    <div class="divider"></div>

                    <p>If you have any issues, please contact our support team.</p>

                    <p>Best regards,<br><strong>Inventory Management System</strong></p>

                    <p class="test-notice">These is test mail. If you are receiving this means this is just test mail may be developer added your mail id by mistak so ignore this please do not reply this. This mail is just for the testing purpose only.</p>
                </div>

                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Inventory Management System. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendMail(recipientEmail, subject, htmlContent);
};

// Mail 2: New Employee Add
const sendNewEmployeeMail = async (recipientEmail, tempPassword, role, ownerName, businessName) => {
    const loginLink = `http://localhost:5173/`;
    const subject = `Welcome to ${businessName} - Account Set Up`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 500px; margin: 0 auto; padding: 0; }
                .header { background-color: #4f63d2; color: white; padding: 30px 20px; text-align: center; }
                .header h2 { margin: 0; font-size: 24px; }
                .content { background-color: #ffffff; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
                .footer { background-color: #f0f0f0; padding: 15px 20px; text-align: center; font-size: 12px; color: #666; border: 1px solid #ddd; border-top: none; }
                .button { display: inline-block; background-color: #4f63d2; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
                .button:hover { background-color: #3a4eb8; }
                .warning { color: #d9534f; font-weight: bold; }
                .divider { border-top: 1px solid #ddd; margin: 20px 0; }
                .credential-box { background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; margin: 15px 0; color: #333; }
                p { margin: 10px 0; color: #333; font-size: 14px; }
                .test-notice { font-size: 11px; color: #888; text-align: center; font-style: italic; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Welcome to the Team!</h2>
                </div>

                <div class="content">
                    <p>Hello,</p>

                    <p>Welcome to <strong>${businessName}</strong>. You have been officially invited to join our Inventory Management System by <strong>${ownerName}</strong>.</p>
                    
                    <p>You have been assigned the role of <strong>${role.toUpperCase()}</strong>. You are now authorized to log in, access the system, and manage our inventory records.</p>

                    <div class="divider"></div>

                    <p>Here are your login credentials. You can access the portal by clicking the button below.</p>
                    
                    <div class="credential-box">
                        <strong>Email:</strong> ${recipientEmail}<br>
                        <strong>Password:</strong> ${tempPassword}
                    </div>

                    <center>
                        <a href="${loginLink}"><div class="button">Login</div></a>
                    </center>

                    <div class="divider"></div>

                    <p><span class="warning">⚠️ Important Security Notice:</span></p>
                    <p>For your security, <strong>you must change your password immediately upon your first login.</strong> Do not share these credentials with anyone.</p>

                    <p>Best regards,<br><strong>${businessName} Administration</strong></p>

                    <p class="test-notice">These is test mail. If you are receiving this means this is just test mail may be developer added your mail id by mistak so ignore this please do not reply this. This mail is just for the testing purpose only.</p>
                </div>

                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendMail(recipientEmail, subject, htmlContent);
};

module.exports = {
    sendPasswordResetMail,
    sendNewEmployeeMail
};