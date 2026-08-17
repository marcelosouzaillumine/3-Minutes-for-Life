import type { CanonicalPaymentEvent } from '../PaymentProvider';

export class AsaasWebhookAdapter {
  /**
   * Normalizes an Asaas webhook payload into a CanonicalPaymentEvent.
   * Returns null if the event is not relevant to our Domain.
   */
  static normalize(payload: any): CanonicalPaymentEvent | null {
    if (!payload || !payload.event || !payload.payment) {
      return null;
    }

    const eventId = payload.id;
    const providerReference = payload.payment.id;
    const asaasEvent = payload.event;
    
    let eventType: CanonicalPaymentEvent['eventType'];

    // Map the events the MVP needs
    switch (asaasEvent) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        eventType = 'PAYMENT_CONFIRMED';
        break;
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        eventType = 'PAYMENT_FAILED';
        break;
      case 'PAYMENT_OVERDUE':
        eventType = 'PAYMENT_FAILED'; // In our domain, overdue One-Time is failed/canceled
        break;
      default:
        // Ignore everything else (e.g. PAYMENT_CREATED, PAYMENT_UPDATED)
        return null;
    }

    return {
      provider: 'asaas',
      providerEventId: eventId,
      eventType: eventType,
      occurredAt: new Date(payload.dateCreated || new Date().toISOString()),
      referenceId: providerReference,
      rawPayload: payload
    };
  }
}
