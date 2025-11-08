import os
import ssl
import logging
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import Optional, List, Dict, Any
from datetime import datetime

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        """Initialize SendGrid email service"""
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@restaurantreservation.com")
        self.from_name = os.getenv("FROM_NAME", "Restaurant Reservation System")
        
        if not self.api_key:
            logger.error("SENDGRID_API_KEY not found in environment variables")
            raise ValueError("SendGrid API key is required")
        
        # Handle SSL context for Windows environments
        try:
            # Try to create an unverified context for development
            ssl._create_default_https_context = ssl._create_unverified_context
        except:
            pass
            
        # Initialize SendGrid client with SSL handling
        try:
            self.sg = SendGridAPIClient(api_key=self.api_key)
        except Exception as ssl_error:
            # If SSL issues, try with requests session that ignores SSL
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            session = requests.Session()
            session.verify = False
            # Disable SSL warnings
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            self.sg = SendGridAPIClient(api_key=self.api_key)
            # Override the session
            self.sg.client.http = session
        logger.info("SendGrid email service initialized")

    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str, 
        plain_content: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """
        Send an email using SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            plain_content: Plain text email content (optional)
            to_name: Recipient name (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create email
            from_email_obj = Email(self.from_email, self.from_name)
            to_email_obj = To(to_email, to_name)
            
            # Use HTML content as primary, fallback to plain text
            content = Content("text/html", html_content)
            
            mail = Mail(from_email_obj, to_email_obj, subject, content)
            
            # Add plain text version if provided
            if plain_content:
                mail.add_content(Content("text/plain", plain_content))
            
            # Send email
            response = self.sg.send(mail)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}. Status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False

    def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new user"""
        subject = "Welcome to Restaurant Reservation System!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Restaurant Reservation System</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Restaurant Reservation System! 🍽️</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name}!</h2>
                    <p>Welcome to our restaurant reservation platform! We're excited to have you join our community of food lovers.</p>
                    
                    <h3>What you can do:</h3>
                    <ul>
                        <li>🔍 Discover amazing restaurants near you</li>
                        <li>📅 Make reservations instantly</li>
                        <li>⭐ Read reviews and ratings</li>
                        <li>🎯 Get personalized recommendations</li>
                        <li>🤖 Use our voice assistant for easy booking</li>
                    </ul>
                    
                    <p>Ready to explore? Start by setting up your location preferences!</p>
                    
                    <a href="#" class="button">Start Exploring Restaurants</a>
                    
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    
                    <p>Happy dining!</p>
                </div>
                <div class="footer">
                    <p>© 2025 Restaurant Reservation System. All rights reserved.</p>
                    <p>You received this email because you signed up for our service.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_content = f"""
        Welcome to Restaurant Reservation System!
        
        Hello {user_name}!
        
        Welcome to our restaurant reservation platform! We're excited to have you join our community of food lovers.
        
        What you can do:
        - Discover amazing restaurants near you
        - Make reservations instantly  
        - Read reviews and ratings
        - Get personalized recommendations
        - Use our voice assistant for easy booking
        
        Ready to explore? Start by setting up your location preferences!
        
        If you have any questions, feel free to reach out to our support team.
        
        Happy dining!
        
        © 2025 Restaurant Reservation System. All rights reserved.
        """
        
        return self.send_email(user_email, subject, html_content, plain_content, user_name)

    def send_reservation_confirmation(
        self, 
        user_email: str, 
        user_name: str, 
        reservation_details: Dict[str, Any]
    ) -> bool:
        """Send reservation confirmation email"""
        restaurant_name = reservation_details.get('restaurant_name', 'Restaurant')
        reservation_date = reservation_details.get('date', 'TBD')
        reservation_time = reservation_details.get('time', 'TBD')
        party_size = reservation_details.get('party_size', 1)
        reservation_id = reservation_details.get('reservation_id', 'N/A')
        
        subject = f"Reservation Confirmed - {restaurant_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reservation Confirmation</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .reservation-card {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reservation Confirmed! ✅</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name}!</h2>
                    <p>Great news! Your reservation has been confirmed. Here are the details:</p>
                    
                    <div class="reservation-card">
                        <h3>{restaurant_name}</h3>
                        <div class="detail-row">
                            <strong>Reservation ID:</strong>
                            <span>{reservation_id}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Date:</strong>
                            <span>{reservation_date}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Time:</strong>
                            <span>{reservation_time}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Party Size:</strong>
                            <span>{party_size} people</span>
                        </div>
                    </div>
                    
                    <p><strong>Important Notes:</strong></p>
                    <ul>
                        <li>Please arrive on time for your reservation</li>
                        <li>Contact the restaurant directly if you need to make changes</li>
                        <li>Show this confirmation email or your reservation ID</li>
                    </ul>
                    
                    <p>We hope you have a wonderful dining experience!</p>
                </div>
                <div class="footer">
                    <p>© 2025 Restaurant Reservation System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_content = f"""
        Reservation Confirmed!
        
        Hello {user_name}!
        
        Great news! Your reservation has been confirmed. Here are the details:
        
        Restaurant: {restaurant_name}
        Reservation ID: {reservation_id}
        Date: {reservation_date}
        Time: {reservation_time}
        Party Size: {party_size} people
        
        Important Notes:
        - Please arrive on time for your reservation
        - Contact the restaurant directly if you need to make changes
        - Show this confirmation email or your reservation ID
        
        We hope you have a wonderful dining experience!
        
        © 2025 Restaurant Reservation System. All rights reserved.
        """
        
        return self.send_email(user_email, subject, html_content, plain_content, user_name)

# Global email service instance
email_service = EmailService()

def get_email_service() -> EmailService:
    """Get the email service instance"""
    return email_service