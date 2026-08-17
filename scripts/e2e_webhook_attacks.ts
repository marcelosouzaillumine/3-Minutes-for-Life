import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// For testing edge function locally we can assume the remote or local one.
const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`; 
const asaasToken = 'b59c02f9-60d0-4619-894b-0f1dafe56d0f'; // Assuming this was meant as the webhook token

const supabase = createClient(supabaseUrl, supabaseKey);

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('--- GATE 4.5: FASE C (SIMULAÇÃO E2E E ATAQUES) ---');

  console.log('\n[Setup] Criando Contribuição de Teste...');
  const userId = '00000000-0000-0000-0000-000000000001'; 
  const { data: supporter } = await supabase.from('supporters')
    .upsert({ user_id: userId, status: 'active' }).select('id').single();

  const providerReference = 'pay_' + Date.now();
  const { data: contrib } = await supabase.from('contributions')
    .insert({
      supporter_id: supporter!.id,
      amount: 1500, currency: 'BRL', frequency: 'one_time',
      status: 'pending', provider: 'asaas', provider_reference: providerReference
    }).select('id, status').single();

  console.log(`1. Criação: contribution.status = ${contrib!.status}, provider_reference = ${providerReference}`);

  // Base Payload Mocado Asaas
  const eventId = 'evt_' + Date.now();
  const validPayload = {
    id: eventId, event: 'PAYMENT_RECEIVED', dateCreated: new Date().toISOString(),
    payment: { id: providerReference }
  };

  // Ataque 1: Webhook Falsificado (Token Errado)
  console.log('\n[Ataque 1] Webhook Falsificado (wrong-token)...');
  let res = await fetch(webhookUrl, {
    method: 'POST', headers: { 'asaas-access-token': 'wrong-token' }, body: JSON.stringify(validPayload)
  });
  console.log(`HTTP Status: ${res.status}`);
  let check = await supabase.from('payment_events').select('id').eq('provider_event_id', eventId);
  console.log(`payment_events criados: ${check.data?.length}`);

  // Ataque 2: Referência Inexistente (G8)
  console.log('\n[Ataque 2] Referência Inexistente (Autenticado mas payload fraudado)...');
  const eventIdInexistent = 'evt_inexistent_' + Date.now();
  res = await fetch(webhookUrl, {
    method: 'POST', headers: { 'asaas-access-token': asaasToken }, 
    body: JSON.stringify({ ...validPayload, id: eventIdInexistent, payment: { id: 'pay_fraud' } })
  });
  console.log(`HTTP Status: ${res.status}`);
  check = await supabase.from('payment_events').select('id').eq('provider_event_id', eventIdInexistent);
  console.log(`payment_events criados: ${check.data?.length}`);
  let contribCheck = await supabase.from('contributions').select('status').eq('id', contrib!.id).single();
  console.log(`contribution.status = ${contribCheck.data?.status}`);

  // E2E Real Mocado: Caminho Feliz
  console.log('\n[Fluxo Feliz] Recebendo Webhook Válido...');
  res = await fetch(webhookUrl, {
    method: 'POST', headers: { 'asaas-access-token': asaasToken }, body: JSON.stringify(validPayload)
  });
  console.log(`HTTP Status: ${res.status}`);
  check = await supabase.from('payment_events').select('id').eq('provider_event_id', eventId);
  console.log(`payment_events criados: ${check.data?.length}`);
  contribCheck = await supabase.from('contributions').select('status').eq('id', contrib!.id).single();
  console.log(`contribution.status = ${contribCheck.data?.status}`);

  // Idempotência
  console.log('\n[Idempotência] Reenviando EXATAMENTE o mesmo Webhook...');
  res = await fetch(webhookUrl, {
    method: 'POST', headers: { 'asaas-access-token': asaasToken }, body: JSON.stringify(validPayload)
  });
  console.log(`HTTP Status: ${res.status}`);
  check = await supabase.from('payment_events').select('id').eq('provider_event_id', eventId);
  console.log(`payment_events totais para esse evento: ${check.data?.length}`);

  // Cleanup
  await supabase.from('payment_events').delete().like('provider_event_id', 'evt_%');
  await supabase.from('contributions').delete().eq('id', contrib!.id);
}
run().catch(console.error);
