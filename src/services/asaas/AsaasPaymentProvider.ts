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

  async createRecurringContribution(input: RecurringContributionInput): Promise<ContributionCheckout> {
    if (input.paymentMethod !== 'pix') {
      throw new Error('Only PIX is supported in this Gate 4.3 MVP');
    }

    const customerId = await this.resolveCustomer(input.customer);
    const value = input.amountInCents / 100;
    const nextDueDate = new Date().toISOString().split('T')[0];

    const subscriptionPayload = {
      customer: customerId,
      billingType: 'PIX',
      value: value,
      nextDueDate: nextDueDate,
      cycle: input.cycle || 'MONTHLY',
      externalReference: input.contributionId,
      description: input.cycle === 'YEARLY' ? 'Apoio Anual à Missão 3 Minutos para a Vida' : 'Apoio Mensal à Missão 3 Minutos para a Vida'
    };

    const subRes = await this.client.post<{ id: string; paymentLink?: string }>('/subscriptions', subscriptionPayload);
    const subscriptionId = subRes.id;

    let paymentUrl = subRes.paymentLink || `https://www.asaas.com/c/${subscriptionId}`;
    let pixPayload: string | undefined;
    let pixQrCodeUrl: string | undefined;

    try {
      const paymentsRes = await this.client.get<{ data: Array<{ id: string; invoiceUrl: string }> }>(`/subscriptions/${subscriptionId}/payments`);
      if (paymentsRes.data && paymentsRes.data.length > 0) {
        const firstPayment = paymentsRes.data[0];
        paymentUrl = firstPayment.invoiceUrl || paymentUrl;

        const pixRes = await this.client.get<{ encodedImage: string; payload: string }>(`/payments/${firstPayment.id}/pixQrCode`);
        pixPayload = pixRes.payload;
        pixQrCodeUrl = `data:image/png;base64,${pixRes.encodedImage}`;
      }
    } catch {
      // Best effort QR code retrieval
    }

    return {
      paymentUrl,
      pixPayload,
      pixQrCodeUrl,
      providerReference: subscriptionId
    };
  }

  async cancelRecurringContribution(providerReference: string): Promise<void> {
    await this.client.delete(`/subscriptions/${providerReference}`);
  }

  async normalizeWebhookEvent(_headers: Record<string, string>, _rawBody: string): Promise<CanonicalPaymentEvent | null> {
    throw new Error('Webhook normalization not implemented yet.');
  }
}
