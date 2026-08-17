import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

function generateCpf() {
  const num = () => Math.floor(Math.random() * 9);
  let n = Array(9).fill(0).map(num);
  let d1 = n.reduce((acc, val, i) => acc + val * (10 - i), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  let d2 = [...n, d1].reduce((acc, val, i) => acc + val * (11 - i), 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  return [...n, d1, d2].join('');
}

serve(async (req) => {
  const logs: string[] = [];
  const log = (msg: string) => { console.log(msg); logs.push(msg); };
  
  const assert = (condition: boolean, msg: string) => {
    if (!condition) {
      const errorMsg = `ASSERTION FAILED: ${msg}`;
      log(errorMsg);
      throw new Error(errorMsg);
    }
    log(`✅ ASSERT PASS: ${msg}`);
  };

  try {
    log('--- STARTING GATE 4.5 E2E RE-CERTIFICATION TESTS ---');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const asaasWebhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`;
    
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    
    assert(!!asaasApiKey && !!asaasToken, "Asaas Keys must be present in Deno.env");

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    log('1. Preparando base de dados (Pegando um Profile existente)...');
    
    const { data: existingProfile, error: errProf } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
    assert(!errProf && !!existingProfile, "Deve encontrar um profile válido");
    const userId = existingProfile.id;
    
    const { data: supporter, error: supErr } = await supabaseAdmin.from('supporters')
      .upsert({ user_id: userId, status: 'active' }).select('id').single();
    assert(!supErr && !!supporter, "Deve criar ou achar o supporter");

    const providerReference = 'pay_' + Date.now();
    const { data: contrib, error: contribErr } = await supabaseAdmin.from('contributions')
      .insert({
        supporter_id: supporter.id,
        amount: 15.00, currency: 'BRL', frequency: 'one_time',
        status: 'pending', provider: 'asaas', provider_reference: providerReference
      }).select('id, status').single();

    assert(!contribErr && !!contrib, "Deve inserir contribution com status pending");
    assert(contrib.status === 'pending', "Status inicial da contribution deve ser pending");

    // --- ASAAS API TEST ---
    log('\n3. Testando criação de PIX na API Real do Asaas Sandbox...');
    const asaasRes = await fetch('https://sandbox.asaas.com/api/v3/customers', {
      method: 'POST',
      headers: { 'access_token': asaasApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test E2E Recert', email: 'test_e2e_recert@test.com', cpfCnpj: generateCpf() })
    });
    
    assert(asaasRes.ok, `Customer deve ser criado no Asaas (Status ${asaasRes.status})`);
    const asaasData = await asaasRes.json();
    assert(!!asaasData.id, "Asaas deve retornar o ID do customer");
       
    const pixRes = await fetch('https://sandbox.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: { 'access_token': asaasApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: asaasData.id,
        billingType: 'PIX',
        value: 15.00,
        dueDate: new Date().toISOString().split('T')[0],
        description: 'Apoio Mission E2E Recertificação',
        externalReference: providerReference
      })
    });
    
    assert(pixRes.ok, `Pagamento PIX deve ser criado (Status ${pixRes.status})`);
    const pixData = await pixRes.json();
    assert(!!pixData.id, "Asaas deve retornar ID do pagamento PIX");
    
    log(`Buscando QR Code explícito para o payment ${pixData.id}...`);
    const qrRes = await fetch(`https://sandbox.asaas.com/api/v3/payments/${pixData.id}/pixQrCode`, {
      headers: { 'access_token': asaasApiKey! }
    });
    assert(qrRes.ok, "Consulta do QR Code deve retornar 200 OK");
    const qrData = await qrRes.json();
    assert(!!qrData.encodedImage && !!qrData.payload, "Endpoint de QR Code deve retornar imagem e payload");

    // --- WEBHOOK ATTACKS ---
    log('\n4. Testes de Ataque e Fronteira do Webhook');
    const eventId = 'evt_' + Date.now();
    const validPayload = {
      id: eventId, event: 'PAYMENT_RECEIVED', dateCreated: new Date().toISOString(),
      payment: { id: providerReference }
    };

    log('[Ataque A] Token Falsificado');
    const resA = await fetch(asaasWebhookUrl, {
      method: 'POST', headers: { 'asaas-access-token': 'wrong-token' }, body: JSON.stringify(validPayload)
    });
    assert(resA.status === 401, "Webhook com token falso deve retornar 401");

    log('[Ataque B] Referência Inexistente (G8)');
    const eventIdInexistent = 'evt_inexistent_' + Date.now();
    const resB = await fetch(asaasWebhookUrl, {
      method: 'POST', headers: { 'asaas-access-token': asaasToken! }, 
      body: JSON.stringify({ ...validPayload, id: eventIdInexistent, payment: { id: 'pay_fraud' } })
    });
    assert(resB.status === 200, "Webhook autenticado com ref inexistente deve retornar 200");
    const { count: checkB } = await supabaseAdmin.from('payment_events').select('id', { count: 'exact' }).eq('provider_event_id', eventIdInexistent);
    assert(checkB === 1, "Evento de falha de referência deve ser persistido (Auditoria)");
    
    const { data: contribCheckB } = await supabaseAdmin.from('contributions').select('status').eq('id', contrib.id).single();
    assert(contribCheckB.status === 'pending', "Ataque B não deve mutar a contribution existente");

    log('\n[Fluxo Feliz] Simulação de Pagamento no Sandbox (Recebimento)');
    // Simulando o pagamento internamente no Asaas para ele gerar um evento real se o webhook real estivesse configurado
    const receiveRes = await fetch(`https://sandbox.asaas.com/api/v3/payments/${pixData.id}/receiveInCash`, {
      method: 'POST',
      headers: { 'access_token': asaasApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 15.00, paymentDate: new Date().toISOString().split('T')[0] })
    });
    assert(receiveRes.ok, "Deve ser possível simular recebimento no Sandbox (receiveInCash)");
    log('Pagamento simulado no Asaas! Disparando Webhook Local correspondente...');

    const resHappy = await fetch(asaasWebhookUrl, {
      method: 'POST', headers: { 'asaas-access-token': asaasToken! }, body: JSON.stringify(validPayload)
    });
    assert(resHappy.status === 200, "Webhook válido deve retornar 200");
    const { count: checkHappy } = await supabaseAdmin.from('payment_events').select('id', { count: 'exact' }).eq('provider_event_id', eventId);
    assert(checkHappy === 1, "Deve haver exatamente 1 payment_event válido salvo");
    
    const { data: contribCheckHappy } = await supabaseAdmin.from('contributions').select('status').eq('id', contrib.id).single();
    assert(contribCheckHappy.status === 'completed', "Contribution status deve ter mudado para completed");

    log('\n[Idempotência] Reenviando EXATAMENTE o mesmo Webhook');
    const resIdemp = await fetch(asaasWebhookUrl, {
      method: 'POST', headers: { 'asaas-access-token': asaasToken! }, body: JSON.stringify(validPayload)
    });
    assert(resIdemp.status === 200, "Webhook duplicado deve retornar 200 para o Asaas");
    const { count: checkIdemp } = await supabaseAdmin.from('payment_events').select('id', { count: 'exact' }).eq('provider_event_id', eventId);
    assert(checkIdemp === 1, "Não devem ser criados registros duplicados em payment_events");

    // Cleanup
    await supabaseAdmin.from('payment_events').delete().like('provider_event_id', 'evt_%');
    await supabaseAdmin.from('contributions').delete().eq('id', contrib.id);
    
    return new Response(JSON.stringify({ success: true, logs }, null, 2), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    log(`ERRO FATAL: ${error.message}`);
    return new Response(JSON.stringify({ success: false, logs }, null, 2), { headers: { 'Content-Type': 'application/json' } });
  }
});
