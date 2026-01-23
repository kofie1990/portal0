import * as React from 'react';

interface BookingConfirmedEmailProps {
    customerName: string;
    serviceName: string;
    providerName: string;
    date: string;
    amountPaid: string;
    bookingUrl: string;
}

export const BookingConfirmedEmail: React.FC<BookingConfirmedEmailProps> = ({
    customerName,
    serviceName,
    providerName,
    date,
    amountPaid,
    bookingUrl,
}) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#1a1a1a' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Booking Confirmed!</h1>
        <p>Hi {customerName},</p>
        <p>Great news! Your booking has been confirmed by {providerName}.</p>

        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
            <p style={{ margin: '0 0 10px' }}><strong>Service:</strong> {serviceName}</p>
            <p style={{ margin: '0 0 10px' }}><strong>Date & Time:</strong> {date}</p>
            <p style={{ margin: '0 0 10px' }}><strong>Amount Paid:</strong> {amountPaid}</p>
        </div>

        <p>You can view your booking details here:</p>
        <a href={bookingUrl} style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#000', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
            View Booking
        </a>

        <p style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
            If you have any questions, please contact the provider directly.
        </p>
    </div>
);
