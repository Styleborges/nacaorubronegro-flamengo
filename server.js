// BACKEND - servidor simples em Express (coloque na mesma pasta)
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/auth/discord/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

if(!CLIENT_ID || !CLIENT_SECRET){
  console.warn("⚠️ CLIENT_ID ou CLIENT_SECRET não configurados no .env");
}

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// 1) Redireciona para Discord OAuth
app.get('/auth/discord', (req, res) => {
  const scopes = encodeURIComponent('identify guilds');
  const redirect = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes}`;
  return res.redirect(redirect);
});

// 2) Callback: troca code por token
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if(!code) return res.status(400).send('No code provided');

  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, token_type } = tokenRes.data;
    // Pega dados do usuário (identify)
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `${token_type} ${access_token}` }
    });

    // Aqui você pode salvar a sessão no DB; em demo redirecionamos para o frontend com token (NÃO recomendado em produção)
    const tokenToSend = access_token;
    return res.redirect(`${FRONTEND_URL}/?token=${encodeURIComponent(tokenToSend)}`);
  } catch (err) {
    console.error('Erro no callback', err.response?.data || err.message);
    return res.status(500).send('Erro ao trocar código por token');
  }
});

// Endpoint demo: cria invoice falso
app.post('/api/create-invoice', (req, res) => {
  const { item } = req.body;
  if(!item) return res.status(400).json({ error: 'item required' });

  const id = Math.random().toString(36).slice(2,9);
  const price = item === 'painel' ? 9.90 : 49.9;
  const payLink = `https://meu-pagamento-demo.com/pay/${id}`;

  return res.json({
    invoice_id: id,
    item,
    price,
    price_str: `R$ ${price.toFixed(2)}`,
    pay_link: payLink
  });
});

// Endpoint protegido do painel: precisa Authorization: Bearer <token>
app.get('/api/panel-data', async (req, res) => {
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];

  // Demo: você pode verificar token chamando Discord ou consultar DB
  return res.json({
    users: 5123,
    guilds: 260,
    support: "24/7"
  });
});

// painel simples (página estática retornando uma mensagem)
app.get('/panel', (req, res) => {
  res.send(`<h1>Painel (demo)</h1><p>Use o token válido no header Authorization para acessar a API.</p>`);
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
