import type {
  PaymentProvider,
  OneTimeContributionInput,
  RecurringContributionInput,
  ContributionCheckout,
  CanonicalPaymentEvent
} from '../PaymentProvider';
import { AsaasClient } from './AsaasClient';

export class AsaasPaymentProvider implements PaymentProvider {
  private client: AsaasClient;
  constructor(client: AsaasClient) {
    this.client = client;
  }

  /**
   * Resolves an Asaas customer by email or creates a new one.
   */
  private async resolveCustomer(customerData: { name: string; email: string; cpfCnpj?: string }): Promise<string> {
    // 1. Search for existing customer by email
    const searchRes = await this.client.get<{ data: Array<{ id: string }> }>(`/customers?email=${encodeURIComponent(customerData.email)}`);
    
    if (searchRes.data && searchRes.data.length > 0) {
      return searchRes.data[0].id;
    }

    // 2. Create new customer
    const createRes = await this.client.post<{ id: string }>('/customers', {
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj
    });

    return createRes.id;
  }

  async createOneTimeContribution(input: OneTimeContributionInput): Promise<ContributionCheckout> {
    if (input.paymentMethod !== 'pix') {
      throw new Error('Only PIX is supported in this Gate 4.3 MVP');
    }

    const customerId = await this.resolveCustomer(input.customer);

    // Asaas expects value in BRL (number) instead of cents
    const value = input.amountInCents / 100;
    
    // Set dueDate to 3 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    // Create the payment charge
    const paymentPayload = {
      customer: customerId,
      billingType: 'PIX',
      value: value,
      dueDate: dueDate.toISOString().split('T')[0],
      externalReference: input.contributionId,
      description: 'Apoio à Missão 3 Minutos para a Vida'
    };

    const paymentRes = await this.client.post<{ id: string; invoiceUrl: string }>('/payments', paymentPayload);
    const providerReference = paymentRes.id;

    // Fetch the PIX payload and QR Code Base64
    const pixRes = await this.client.get<{ encodedImage: string; payload: string }>(`/payments/${providerReference}/pixQrCode`);

    return {
      paymentUrl: paymentRes.invoiceUrl,
      pixPayload: pixRes.payload,
      pixQrCodeUrl: `data:image/png;base64,${pixRes.encodedImage}`,
      providerReference
    };
  }

  async createRecurringContribution(_input: RecurringContributionInput): Promise<ContributionCheckout> {
    throw new Error('Recurring contributions (Pix Automático) not implemented yet.');
  }

  async cancelRecurringContribution(_providerReference: string): Promise<void> {
    throw new Error('Cancellation not implemented yet.');
  }

  async normalizeWebhookEvent(_headers: Record<string, string>, _rawBody: string): Promise<CanonicalPaymentEvent | null> {
    throw new Error('Webhook normalization not implemented yet.');
  }
}
