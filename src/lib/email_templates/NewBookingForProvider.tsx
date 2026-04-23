import * as React from 'react';

interface NewBookingForProviderEmailProps {
    providerName: string;
    customerName: string;
    customerPhone: string | null;
    serviceName: string;
    date: string;
    amountPaid: string;
    totalAmount: string;
    bookingNotes: string | null;
    dashboardUrl: string;
    calendarUrl: string;
    clientBookingsUrl: string;
    businessPageUrl: string | null;
    appUrl: string;
}

export const NewBookingForProviderEmailHtml = ({
    providerName,
    customerName,
    customerPhone,
    serviceName,
    date,
    amountPaid,
    totalAmount,
    bookingNotes,
    dashboardUrl,
    calendarUrl,
    clientBookingsUrl,
    businessPageUrl,
    appUrl,
}: NewBookingForProviderEmailProps) => `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #171717; background-color: #fcfcfc; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e5e5; overflow: hidden; text-align: left; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);">
            <div style="padding: 32px; background-color: #0a0a0a; text-align: center; border-bottom: 1px solid #1f1f1f;">
                <img src="${appUrl}/portal_logo.png" alt="Portal Logo" style="height: 48px; width: auto; object-fit: contain;" />
            </div>
            
            <div style="padding: 40px 32px;">
                <!-- Success Badge -->
                <div style="text-align: center; margin-bottom: 28px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-radius: 50%; width: 64px; height: 64px; line-height: 64px; text-align: center; font-size: 28px;">
                        ✓
                    </div>
                </div>

                <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 8px; color: #000000; letter-spacing: -0.02em; text-align: center;">New Booking Confirmed!</h1>
                <p style="font-size: 14px; margin: 0 0 32px; color: #737373; text-align: center;">A customer just booked your service</p>
                
                <p style="font-size: 16px; margin: 0 0 16px; color: #404040;">Hi <strong style="color: #000;">${providerName}</strong>,</p>
                <p style="font-size: 16px; margin: 0 0 32px; color: #525252;">Great news! <strong style="color: #000;">${customerName}</strong> has just confirmed a booking for your service. Here are the details:</p>

                <!-- Booking Details Card -->
                <div style="background-color: #fafafa; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #f0f0f0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Service</span>
                        <span style="color: #000000; font-weight: 600; font-size: 15px; text-align: right;">${serviceName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Date & Time</span>
                        <span style="color: #000000; font-weight: 600; font-size: 15px; text-align: right;">${date}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Deposit Paid</span>
                        <span style="color: #16a34a; font-weight: 600; font-size: 15px; text-align: right;">${amountPaid}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Total Service Price</span>
                        <span style="color: #000000; font-weight: 600; font-size: 15px; text-align: right;">${totalAmount}</span>
                    </div>
                </div>

                <!-- Customer Details Card -->
                <div style="background-color: #fafafa; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f0f0f0;">
                    <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; margin: 0 0 16px; font-weight: 600;">Customer Details</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: ${customerPhone ? '16px' : '0'}; ${customerPhone ? 'border-bottom: 1px solid #e5e5e5; padding-bottom: 16px;' : ''}">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Name</span>
                        <span style="color: #000000; font-weight: 600; font-size: 15px; text-align: right;">${customerName}</span>
                    </div>
                    ${customerPhone ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #737373; font-size: 14px; font-weight: 500;">Phone</span>
                        <a href="tel:${customerPhone}" style="color: #000000; font-weight: 600; font-size: 15px; text-decoration: none; text-align: right;">${customerPhone}</a>
                    </div>
                    ` : ''}
                </div>

                ${bookingNotes ? `
                <div style="margin-bottom: 32px;">
                    <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; margin: 0 0 12px; font-weight: 600;">Notes</h3>
                    <div style="background-color: #fff; border-left: 3px solid #000; padding: 16px; background-color: #fafafa; font-size: 14px; color: #525252; white-space: pre-wrap; line-height: 1.5; border-radius: 0 8px 8px 0;">
                        ${bookingNotes}
                    </div>
                </div>
                ` : ''}

                <!-- Primary CTA -->
                <div style="text-align: center; margin: 32px 0 24px;">
                    <a href="${clientBookingsUrl}" style="display: inline-block; padding: 16px 36px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        View Client Bookings
                    </a>
                </div>

                <!-- Quick Links -->
                <div style="background: linear-gradient(135deg, #fafafa, #f5f5f5); border-radius: 16px; padding: 24px; border: 1px solid #e5e5e5;">
                    <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; margin: 0 0 16px; font-weight: 600; text-align: center;">Quick Links</h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 6px 4px; width: 50%;">
                                <a href="${calendarUrl}" style="display: block; text-align: center; padding: 12px 8px; background-color: #ffffff; border-radius: 10px; text-decoration: none; color: #171717; font-size: 13px; font-weight: 600; border: 1px solid #e5e5e5;">
                                    📅 Calendar
                                </a>
                            </td>
                            <td style="padding: 6px 4px; width: 50%;">
                                <a href="${clientBookingsUrl}" style="display: block; text-align: center; padding: 12px 8px; background-color: #ffffff; border-radius: 10px; text-decoration: none; color: #171717; font-size: 13px; font-weight: 600; border: 1px solid #e5e5e5;">
                                    📋 Client Bookings
                                </a>
                            </td>
                        </tr>
                        ${businessPageUrl ? `
                        <tr>
                            <td style="padding: 6px 4px; width: 50%;">
                                <a href="${dashboardUrl}" style="display: block; text-align: center; padding: 12px 8px; background-color: #ffffff; border-radius: 10px; text-decoration: none; color: #171717; font-size: 13px; font-weight: 600; border: 1px solid #e5e5e5;">
                                    ⚙️ Dashboard
                                </a>
                            </td>
                            <td style="padding: 6px 4px; width: 50%;">
                                <a href="${businessPageUrl}" style="display: block; text-align: center; padding: 12px 8px; background-color: #ffffff; border-radius: 10px; text-decoration: none; color: #171717; font-size: 13px; font-weight: 600; border: 1px solid #e5e5e5;">
                                    🌐 View Business
                                </a>
                            </td>
                        </tr>
                        ` : `
                        <tr>
                            <td colspan="2" style="padding: 6px 4px;">
                                <a href="${dashboardUrl}" style="display: block; text-align: center; padding: 12px 8px; background-color: #ffffff; border-radius: 10px; text-decoration: none; color: #171717; font-size: 13px; font-weight: 600; border: 1px solid #e5e5e5;">
                                    ⚙️ Account Dashboard
                                </a>
                            </td>
                        </tr>
                        `}
                    </table>
                </div>
            </div>
            
            <div style="background-color: #fafafa; padding: 32px; border-top: 1px solid #e5e5e5; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #737373; line-height: 1.5;">
                    Need to reschedule? Log in to your <a href="${clientBookingsUrl}" style="color: #000; font-weight: 600; text-decoration: underline;">Portal dashboard</a> and manage this booking.
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
