const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new mercadopago.MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});
const payment = new mercadopago.Payment(client);

app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'BartexCraft API funcionando!' });
});

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
      metadata: { nick: nick }
    };

    const response = await payment.create({ body: paymentData });
    
    res.json({
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: response.id
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
