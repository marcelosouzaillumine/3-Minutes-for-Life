import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsaasPaymentProvider } from '../AsaasPaymentProvider';
import { AsaasClient } from '../AsaasClient';
import type { OneTimeContributionInput } from '../../PaymentProvider';

// Mock the AsaasClient
vi.mock('../AsaasClient', () => {
  const AsaasClient = vi.fn();
  AsaasClient.prototype.get = vi.fn();
  AsaasClient.prototype.post = vi.fn();
  return { AsaasClient };
});

describe('AsaasPaymentProvider', () => {
  let clientMock: any;
  let provider: AsaasPaymentProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    clientMock = new AsaasClient({ apiKey: 'fake', environment: 'sandbox' }) as any;
    provider = new AsaasPaymentProvider(clientMock);
  });

  describe('createOneTimeContribution (Pix)', () => {
    const input: OneTimeContributionInput = {
      contributionId: 'contrib_123',
      supporterId: 'supporter_abc',
      amountInCents: 1500, // R$ 15,00
      paymentMethod: 'pix',
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        cpfCnpj: '12345678909'
      }
    };

    it('should throw an error if payment method is not pix', async () => {
      const invalidInput = { ...input, paymentMethod: 'credit_card' as const };
      await expect(provider.createOneTimeContribution(invalidInput)).rejects.toThrow('Only PIX is supported');
    });

    it('should resolve an existing customer and create a PIX payment', async () => {
      // Mock GET /customers?email=...
      clientMock.get.mockImplementation(async (url: string) => {
        if (url.startsWith('/customers')) {
          return { data: [{ id: 'cus_existing' }] };
        }
        if (url.startsWith('/payments/pay_123/pixQrCode')) {
          return { encodedImage: 'base64str', payload: '00020126360014br.gov.bcb.pix...' };
        }
        return {};
      });

      // Mock POST /payments
      clientMock.post.mockResolvedValueOnce({
        id: 'pay_123',
        invoiceUrl: 'https://sandbox.asaas.com/i/123'
      });

      const result = await provider.createOneTimeContribution(input);

      // Verify GET customers was called
      expect(clientMock.get).toHaveBeenCalledWith('/customers?email=john%40example.com');
      
      // Verify POST payments was called with correct payload
      expect(clientMock.post).toHaveBeenCalledWith('/payments', expect.objectContaining({
        customer: 'cus_existing',
        billingType: 'PIX',
        value: 15, // 1500 cents -> 15 BRL
        externalReference: 'contrib_123',
        description: 'Apoio à Missão 3 Minutos para a Vida'
      }));

      // Verify GET pixQrCode was called
      expect(clientMock.get).toHaveBeenCalledWith('/payments/pay_123/pixQrCode');

      // Verify final result
      expect(result).toEqual({
        paymentUrl: 'https://sandbox.asaas.com/i/123',
        pixPayload: '00020126360014br.gov.bcb.pix...',
        pixQrCodeUrl: 'data:image/png;base64,base64str',
        providerReference: 'pay_123'
      });
    });

    it('should create a new customer if not found', async () => {
      // Mock GET /customers (not found)
      clientMock.get.mockImplementation(async (url: string) => {
        if (url.startsWith('/customers')) {
          return { data: [] };
        }
        if (url.startsWith('/payments/pay_456/pixQrCode')) {
          return { encodedImage: 'base64str', payload: '000201...' };
        }
        return {};
      });

      // Mock POST /customers
      clientMock.post.mockImplementation(async (url: string, _body: any) => {
        if (url === '/customers') {
          return { id: 'cus_new' };
        }
        if (url === '/payments') {
          return { id: 'pay_456', invoiceUrl: 'https://sandbox.asaas.com/i/456' };
        }
        return {};
      });

      await provider.createOneTimeContribution(input);

      // Verify POST customers was called
      expect(clientMock.post).toHaveBeenCalledWith('/customers', {
        name: 'John Doe',
        email: 'john@example.com',
        cpfCnpj: '12345678909'
      });

      // Verify POST payments was called with the NEW customer id
      expect(clientMock.post).toHaveBeenCalledWith('/payments', expect.objectContaining({
        customer: 'cus_new'
      }));
    });
  });
});
