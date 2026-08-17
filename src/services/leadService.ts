export interface Lead {
  name: string;
  email: string;
}

export async function submitLead(lead: Lead): Promise<void> {
  // TODO: Integrar com serviço real (ex: ConvertKit, Mailchimp, ou backend próprio).
  // Não estamos salvando no localStorage nem simulando sucesso falso
  // conforme as regras de negócio do MVP.
  
  console.log('Lead recebido (integração pendente):', lead);
  
  // Lança um erro controlado para que a UI saiba que não foi salvo de verdade.
  throw new Error('NOT_IMPLEMENTED');
}
