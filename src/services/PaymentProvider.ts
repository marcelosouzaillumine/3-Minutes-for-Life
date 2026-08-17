export interface OneTimeContributionInput {
  contributionId: string;
  supporterId: string;
  amountInCents: number;
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  customer: {
    name: string;
    email: string;
    cpfCnpj?: string;
  };
}

export interface RecurringContributionInput extends OneTimeContributionInput {
  cycle: 'MONTHLY' | 'YEARLY';
}

export interface ContributionCheckout {
  paymentUrl?: string;             // Hosted checkout link
  pixPayload?: string;             // Copy and paste string for Pix
  pixQrCodeUrl?: string;           // Base64 or URL for the Pix QR Code
  providerReference: string;       // The underlying payment ID or subscription ID
  providerAuthorizationReference?: string; // Specific for recurring Pix (Pix Automático)
}

export interface CanonicalPaymentEvent {
  provider: 'asaas' | 'stripe';
  providerEventId: string;         // Unique idempotency key
  eventType: 
    | 'AUTHORIZATION_ACTIVE'       // Pix Automático authorized
    | 'AUTHORIZATION_CANCELED'     // Pix Automático canceled
    | 'PAYMENT_CONFIRMED'          // Standard payment success
    | 'PAYMENT_FAILED'             // Payment denied or failed
    | 'RECURRING_CANCELED';        // Subscription ended
  occurredAt: Date;
  referenceId: string;             // The provider_reference mapped in contributions
  rawPayload: any;                 // For audit in payment_events
}

export interface PaymentProvider {
  /**
   * Initializes a one-time contribution. Resolves customer implicitly via Adapter.
   */
  createOneTimeContribution(input: OneTimeContributionInput): Promise<ContributionCheckout>;
  
  /**
   * Initializes a recurring contribution. Handles authorization logic internally.
   */
  createRecurringContribution(input: RecurringContributionInput): Promise<ContributionCheckout>;
  
  /**
   * Cancels a recurring contribution at the provider level.
   */
  cancelRecurringContribution(providerReference: string): Promise<void>;
  
  /**
   * Parses, authenticates and normalizes an incoming webhook payload into a Canonical Domain Event.
   */
  normalizeWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<CanonicalPaymentEvent | null>;
}
