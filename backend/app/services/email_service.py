import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from app.config import settings

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, html_content: str):
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("Email credentials not configured, skipping email send")
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.EMAIL_FROM or settings.SMTP_USERNAME
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

async def send_verification_email(email: str, username: str, token: str):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                color: #333;
                padding: 20px;
            }}
            .email-container {{
                max-width: 600px;
                margin: auto;
                background-color: #ffffff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }}
            .button {{
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 25px;
                margin-top: 20px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }}
            .footer {{
                margin-top: 30px;
                font-size: 0.9em;
                color: #777;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <h2>Welcome to AI Food Assistant, {username}!</h2>
            <p>Thanks for signing up. To complete your registration, please confirm your email address by clicking the button below:</p>
            <a href="{verification_url}" class="button">Verify Email</a>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p><a href="{verification_url}">{verification_url}</a></p>
            <p><strong>Note:</strong> This link will expire in 1 hour.</p>
            <div class="footer">
                <p>If you did not sign up for AI Food Assistant, please ignore this email.</p>
                <p>— The AI Food Assistant Team</p>
            </div>
        </div>
    </body>
    </html>
    """

    await send_email(email, "Please confirm your email address", html_content)


async def send_password_reset_email(email: str, username: str, token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Hi {username},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="{reset_url}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>Best regards,<br>AI Food Assistant Team</p>
    </body>
    </html>
    """
    
    await send_email(email, "Reset your AI Food Assistant password", html_content)
