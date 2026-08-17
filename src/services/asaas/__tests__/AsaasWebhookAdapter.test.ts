import { describe, it, expect } from 'vitest';
import { AsaasWebhookAdapter } from '../AsaasWebhookAdapter';

describe('AsaasWebhookAdapter', () => {
  it('should ignore malformed payloads', () => {
    expect(AsaasWebhookAdapter.normalize({})).toBeNull();
    expect(AsaasWebhookAdapter.normalize(null)).toBeNull();
    expect(AsaasWebhookAdapter.normalize({ event: 'PAYMENT_RECEIVED' })).toBeNull();
  });

  it('should normalize PAYMENT_RECEIVED to PAYMENT_CONFIRMED', () => {
    const payload = {
      id: 'evt_123',
      event: 'PAYMENT_RECEIVED',
      dateCreated: '2026-08-17T12:00:00.000Z',
      payment: {
        id: 'pay_123'
      }
    };
    const result = AsaasWebhookAdapter.normalize(payload);
    expect(result).toEqual({
      provider: 'asaas',
      providerEventId: 'evt_123',
      eventType: 'PAYMENT_CONFIRMED',
      occurredAt: new Date('2026-08-17T12:00:00.000Z'),
      referenceId: 'pay_123',
      rawPayload: payload
    });
  });

  it('should map PAYMENT_OVERDUE to PAYMENT_FAILED', () => {
    const payload = {
      id: 'evt_456',
      event: 'PAYMENT_OVERDUE',
      payment: { id: 'pay_456' }
    };
    const result = AsaasWebhookAdapter.normalize(payload);
    expect(result?.eventType).toBe('PAYMENT_FAILED');
    expect(result?.referenceId).toBe('pay_456');
  });

  it('should map PAYMENT_DELETED to PAYMENT_FAILED', () => {
    const payload = {
      id: 'evt_789',
      event: 'PAYMENT_DELETED',
      payment: { id: 'pay_789' }
    };
    const result = AsaasWebhookAdapter.normalize(payload);
    expect(result?.eventType).toBe('PAYMENT_FAILED');
  });

  it('should ignore unknown events like PAYMENT_CREATED', () => {
    const payload = {
      id: 'evt_000',
      event: 'PAYMENT_CREATED',
      payment: { id: 'pay_000' }
    };
    const result = AsaasWebhookAdapter.normalize(payload);
    expect(result).toBeNull();
  });
});
