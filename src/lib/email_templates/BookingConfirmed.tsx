import * as React from 'react';

interface BookingConfirmedEmailProps {
    customerName: string;
    serviceName: string;
    providerName: string;
    date: string;
    amountPaid: string;
    bookingUrl: string;
    bookingPolicies?: string | null;
}

export const BookingConfirmedEmailHtml = ({
    customerName,
    serviceName,
    providerName,
    date,
    amountPaid,
    bookingUrl,
    bookingPolicies,
}: BookingConfirmedEmailProps) => `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Booking Confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>Great news! Your booking has been confirmed by ${providerName}.</p>

        <div style="padding: 20px; background-color: #f5f5f5; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 0 0 10px;"><strong>Date & Time:</strong> ${date}</p>
            <p style="margin: 0 0 10px;"><strong>Amount Paid:</strong> ${amountPaid}</p>
        </div>

        ${bookingPolicies ? `
        <div style="padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 16px;">Booking & Cancellation Policy</h3>
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">${bookingPolicies}</p>
        </div>
        ` : ''}

        <p>You can view your booking details here:</p>
        <a href="${bookingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Booking
        </a>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you have any questions, please contact the provider directly.
        </p>
    </div>
`;
