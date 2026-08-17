import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { AsaasClient } from '../src/services/asaas/AsaasClient';
import { AsaasPaymentProvider } from '../src/services/asaas/AsaasPaymentProvider';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const asaasApiKey = process.env.ASAAS_API_KEY;

if (!asaasApiKey || asaasApiKey === 'your_sandbox_api_key_here') {
  console.error('❌ ERRO: ASAAS_API_KEY não configurada no .env.local');
  console.error('Para rodar o teste E2E, crie uma conta no Sandbox do Asaas e adicione a chave.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const asaasClient = new AsaasClient({ apiKey: asaasApiKey, environment: 'sandbox' });
const provider = new AsaasPaymentProvider(asaasClient);

async function runE2E() {
  console.log('--- GATE 4.5: PIX ONE-TIME E2E (SANDBOX) ---\n');

  // 1. Setup Support
  console.log('1. Preparando base de dados...');
  const userId = '00000000-0000-0000-0000-000000000001'; 
  await supabase.from('profiles').upsert({ id: userId, email: 'e2e@example.com', first_name: 'E2E Tester' });
  
  const { data: supporter } = await supabase.from('supporters')
    .upsert({ user_id: userId, status: 'active' })
    .select('id').single();

  // 2. Create local Contribution (pending)
  const contribId = 'contrib_' + Date.now();
  
  console.log('2. Iniciando contribuição Pix no Asaas...');
  
  try {
    const checkout = await provider.createOneTimeContribution({
      contributionId: contribId,
      supporterId: supporter!.id,
      amountInCents: 1500, // R$ 15,00
      paymentMethod: 'pix',
      customer: {
        name: 'E2E Tester',
        email: 'e2e@example.com',
      }
    });

    console.log('✅ Cobrança criada no Asaas!');
    console.log(`- Provider Reference: ${checkout.providerReference}`);
    
    console.log('\n3. Persistindo contribuição na Mission Foundation...');
    const { data: contrib, error } = await supabase.from('contributions')
      .insert({
        supporter_id: supporter!.id,
        amount: 1500,
        currency: 'BRL',
        frequency: 'one_time',
        status: 'pending',
        provider: 'asaas',
        provider_reference: checkout.providerReference
      })
      .select('id, status').single();

    if (error) throw error;
    console.log(`✅ Contribuição persistida com status: ${contrib.status}`);

    console.log('\n======================================================');
    console.log('💰 INSTRUÇÕES DE PAGAMENTO (SANDBOX)');
    console.log('Link de Checkout:', checkout.paymentUrl);
    console.log('\nPIX Copia e Cola:');
    console.log(checkout.pixPayload);
    console.log('======================================================\n');
    
    console.log('⚠️ ANTES DE PAGAR:');
    console.log('Certifique-se de que a Edge Function "asaas-webhook" está rodando e acessível pelo Asaas.');
    console.log('Exemplo local:');
    console.log('1. supabase functions serve --no-verify-jwt');
    console.log('2. ngrok http 54321');
    console.log('3. Configure a URL do Ngrok + /functions/v1/asaas-webhook no painel do Sandbox Asaas.\n');

    console.log('⏳ Aguardando notificação do Webhook (Polling do banco de dados)...');
    
    let isCompleted = false;
    let attempts = 0;
    while (!isCompleted && attempts < 60) { // Timeout de ~2 minutos
      await new Promise(r => setTimeout(r, 2000));
      process.stdout.write('.');
      
      const { data: check } = await supabase.from('contributions')
        .select('status')
        .eq('id', contrib.id)
        .single();
        
      if (check && check.status === 'completed') {
        isCompleted = true;
        console.log(`\n\n🎉 SUCESSO! Webhook recebido e processado transacionalmente!`);
        console.log(`Status atualizado para: ${check.status}`);
      } else if (check && check.status === 'canceled') {
        isCompleted = true;
        console.log(`\n\n❌ O Asaas reportou falha/expiração (Status: canceled).`);
      }
      attempts++;
    }

    if (!isCompleted) {
      console.log('\n\n⏱️ Timeout. O Webhook não atualizou a tabela em 2 minutos.');
    }

  } catch (err: any) {
    console.error('Erro durante o fluxo:', err.message);
  }
}

runE2E().catch(console.error);
