const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configurar Mercado Pago
const client = new mercadopago.MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});
const payment = new mercadopago.Payment(client);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'BartexCraft API funcionando!' });
});

// Criar pagamento PIX
app.post('/criar-pagamento', async (req, res) => {
  const { nick } = req.body;
  
  try {
    const paymentData = {
      transaction_amount: 19.90,
      description: `VIP Vitalício - BartexCraft (${nick})`,
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@email.com',
        first_name: nick
      },
      notification_url: `${process.env.WEBHOOK_URL || 'https://bartexcraft.onrender.com'}/webhook`,
      metadata: {
        nick: nick
      }
    };

    const response = await payment.create({ body: paymentData });
    
    res.json({
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: response.id
    });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento', details: error.message });
  }
});

// Webhook - Recebe notificação quando pagamento é aprovado
app.post('/webhook', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    try {
      const paymentInfo = await payment.get({ id: data.id });
      
      if (paymentInfo.status === 'approved') {
        const nick = paymentInfo.metadata.nick;
        
        // Ativar VIP no servidor Minecraft
        await activateVIP(nick);
        
        console.log(`VIP ativado para: ${nick}`);
      }
    } catch (error) {
      console.error('Erro no webhook:', error);
    }
  }
  
  res.sendStatus(200);
});

// Função para ativar VIP no Minecraft
async function activateVIP(nick) {
  try {
    // Opção 1: Via RCON (requer plugin RCON no servidor)
    // Opção 2: Via API REST do plugin (recomendado)
    await fetch(`http://localhost:8080/api/vip/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: nick })
    });
  } catch (error) {
    console.error('Erro ao ativar VIP:', error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor BartexCraft rodando na porta ${PORT}`);
  console.log(`📡 Acesse: http://localhost:${PORT}`);
});
