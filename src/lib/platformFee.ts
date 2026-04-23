/**
 * Platform Fee Calculation
 *
 * The platform fee is charged to the CUSTOMER (person booking), not the service provider.
 * - If the provider has set a booking/deposit fee: Platform fee = 10% of that fee
 * - If no booking fee is set (fee <= 0): Platform fee = flat GH₵ 5
 */

const PLATFORM_FEE_PERCENT = 0.10; // 10%
const PLATFORM_FEE_FLAT = 5;       // GH₵ 5

/**
 * Calculate the platform fee based on the booking/deposit fee.
 * @param bookingFee - The booking or deposit amount set by the provider (in GH₵)
 * @returns The platform fee in GH₵
 */
export function calculatePlatformFee(bookingFee: number): number {
    if (bookingFee > 0) {
        return Math.round(bookingFee * PLATFORM_FEE_PERCENT * 100) / 100;
    }
    return PLATFORM_FEE_FLAT;
}

/**
 * Calculate a full charge breakdown for the customer.
 * @param bookingFee - The booking or deposit amount set by the provider (in GH₵)
 * @returns Object with bookingFee, platformFee, and totalCharge (before Paystack processing fee)
 */
export function calculateTotalCharge(bookingFee: number): {
    bookingFee: number;
    platformFee: number;
    totalCharge: number;
} {
    const platformFee = calculatePlatformFee(bookingFee);
    return {
        bookingFee,
        platformFee,
        totalCharge: bookingFee + platformFee,
    };
}
