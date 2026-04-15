import * as React from 'react';

interface BookingReminderEmailProps {
    customerName: string;
    serviceName: string;
    providerName: string;
    date: string;
    bookingUrl: string;
    appUrl: string;
}

export const BookingReminderEmailHtml = ({
    customerName,
    serviceName,
    providerName,
    date,
    bookingUrl,
    appUrl,
}: BookingReminderEmailProps) => `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #171717; background-color: #fcfcfc; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e5e5; overflow: hidden; text-align: left; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);">
            <div style="padding: 32px; background-color: #0a0a0a; text-align: center; border-bottom: 1px solid #1f1f1f;">
                <img src="${appUrl}/portal_logo.png" alt="Portal Logo" style="height: 48px; width: auto; object-fit: contain;" />
            </div>
            
            <div style="padding: 40px 32px;">
                <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 24px; color: #000000; letter-spacing: -0.02em;">Upcoming Appointment Reminder</h1>
                
                <p style="font-size: 16px; margin: 0 0 16px; color: #404040;">Hi <strong style="color: #000;">${customerName}</strong>,</p>
                <p style="font-size: 16px; margin: 0 0 32px; color: #525252;">This is a quick reminder about your upcoming appointment with <strong style="color: #000;">${providerName}</strong>.</p>

                <div style="background-color: #fafafa; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f0f0f0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Service</span>
                        <span style="color: #000000; font-weight: 600; font-size: 15px; text-align: right;">${serviceName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Date & Time</span>
                        <span style="color: #000000; font-weight: 600; font-size: 15px; text-align: right;">${date}</span>
                    </div>
                </div>

                <div style="text-align: center; margin: 40px 0 20px;">
                    <a href="${bookingUrl}" style="display: inline-block; padding: 16px 36px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        View Booking Details
                    </a>
                </div>
            </div>
            
            <div style="background-color: #fafafa; padding: 32px; border-top: 1px solid #e5e5e5; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #737373; line-height: 1.5;">
                    If you need to reschedule or have any questions, simply <strong style="color: #000;">reply to this email</strong> to contact <strong style="color: #000;">${providerName}</strong> directly.
                </p>
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-size: 12px; color: #a3a3a3; font-weight: 500; letter-spacing: 0.02em;">
                        POWERED BY PORTAL
                    </p>
                </div>
            </div>
        </div>
    </div>
`;
