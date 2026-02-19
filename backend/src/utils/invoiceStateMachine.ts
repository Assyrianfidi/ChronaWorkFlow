/**
 * AUDIT FIX P1-5: Invoice State Machine Validation
 * Enforces valid state transitions to prevent invalid invoice statuses
 * Prevents business logic errors like PAID -> DRAFT or VOID -> OPEN
 */

import { InvoiceStatus } from '@prisma/client';

/**
 * Valid invoice state transitions
 * Maps current status to array of allowed next statuses
 */
const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  // DRAFT can transition to OPEN (sent) or VOID (cancelled before sending)
  DRAFT: [InvoiceStatus.OPEN, InvoiceStatus.VOID],
  
  // OPEN can receive payments (PAID), be overdue, or be voided
  OPEN: [InvoiceStatus.PAID, InvoiceStatus.OPEN, InvoiceStatus.VOID],
  
  // PAID is terminal - cannot transition (except void for refund scenarios)
  PAID: [InvoiceStatus.VOID],
  
  // OVERDUE can still be paid or voided
  // OVERDUE: [InvoiceStatus.PAID, InvoiceStatus.VOID], // Status not in schema
  
  // VOID is terminal - cannot transition
  VOID: [],
  
  // UNCOLLECTIBLE is terminal - bad debt write-off
  UNCOLLECTIBLE: [],
};

/**
 * Validates if a status transition is allowed
 * @param currentStatus Current invoice status
 * @param newStatus Desired new status
 * @returns true if transition is valid
 */
export function isValidTransition(
  currentStatus: InvoiceStatus,
  newStatus: InvoiceStatus
): boolean {
  // If status isn't changing, always valid
  if (currentStatus === newStatus) {
    return true;
  }
  
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Gets allowed next states for current status
 * @param currentStatus Current invoice status
 * @returns Array of valid next statuses
 */
export function getAllowedTransitions(
  currentStatus: InvoiceStatus
): InvoiceStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validates and returns new status or throws error
 * @param currentStatus Current invoice status
 * @param newStatus Desired new status
 * @returns newStatus if valid
 * @throws Error if transition is invalid
 */
export function validateTransition(
  currentStatus: InvoiceStatus,
  newStatus: InvoiceStatus
): InvoiceStatus {
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid invoice status transition: ${currentStatus} -> ${newStatus}. ` +
      `Allowed transitions: ${getAllowedTransitions(currentStatus).join(', ')}`
    );
  }
  return newStatus;
}
