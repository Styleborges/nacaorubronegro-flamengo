// server.js - API SIMPLIFICADA PARA REPLIT
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Banco de dados em memória
const codesDB = new Map();
const weaponsDB = new Map();

// Chaves de API (MUDE ESTAS!)
const SECRET_KEYS = {
  DISCORD: "DISCORD_2024_" + Math.random().toString(36).substring(7),
  ROBLOX: "ROBLOX_2024_" + Math.random().toString(36).substring(7)
};

// Middleware simples
const checkAuth = (req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.key;
  
  if (!key || !Object.values(SECRET_KEYS).includes(key)) {
    return res.status(401).json({ error: "Chave inválida" });
  }
  next();
};

// Página inicial
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>📦 API de Códigos - Roblox</title>
      <style>
        body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }
        code { background: #333; color: white; padding: 5px 10px; border-radius: 5px; }
        .key { color: #ff4444; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🚀 API de Códigos Funcionando!</h1>
      <div class="card">
        <h3>📊 Status: <span style="color: green;">ONLINE</span></h3>
        <p>Códigos armazenados: <strong>${codesDB.size}</strong></p>
        <p>URL: <code>${req.protocol}://${req.get('host')}</code></p>
      </div>
      
      <div class="card">
        <h3>🔑 Suas Chaves de API:</h3>
        <p><strong>Discord Bot:</strong> <code class="key">${SECRET_KEYS.DISCORD}</code></p>
        <p><strong>Roblox Game:</strong> <code class="key">${SECRET_KEYS.ROBLOX}</code></p>
        <p><em>Copie estas chaves para configurar o Discord e Roblox</em></p>
      </div>
      
      <div class="card">
        <h3>📡 Endpoints:</h3>
        <p><code>POST /api/codes</code> - Adicionar códigos</p>
        <p><code>GET /api/codes/:code</code> - Verificar código</p>
        <p><code>POST /api/codes/:code/use</code> - Usar código</p>
        <p><code>GET /api/status</code> - Status da API</p>
      </div>
      
      <div class="card">
        <h3>⚡ Como usar:</h3>
        <ol>
          <li>Configure o Bot Discord com a chave acima</li>
          <li>Configure o Roblox com a chave acima</li>
          <li>Gere códigos no Discord</li>
          <li>Use no Roblox instantaneamente!</li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

// Adicionar códigos (Discord → API)
app.post('/api/codes', checkAuth, (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes)) {
      return res.status(400).json({ error: "Envie um array 'codes'" });
    }
    
    const results = [];
    
    codes.forEach(item => {
      const code = item.code?.toUpperCase() || "INVALID";
      const now = Date.now();
      
      codesDB.set(code, {
        code: code,
        type: item.type || "money",
        reward: item.reward || { amount: 1000 },
        createdAt: now,
        used: false,
        usedBy: null
      });
      
      results.push({ code: code, status: "added" });
    });
    
    console.log(`✅ ${codes.length} código(s) adicionados`);
    
    res.json({
      success: true,
      added: codes.length,
      results: results
    });
    
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar código (Roblox ← API)
app.get('/api/codes/:code', checkAuth, (req, res) => {
  const code = req.params.code.toUpperCase();
  const codeData = codesDB.get(code);
  
  if (!codeData) {
    return res.json({
      exists: false,
      message: "Código não encontrado"
    });
  }
  
  if (codeData.used) {
    return res.json({
      exists: true,
      valid: false,
      message: "Código já foi usado"
    });
  }
  
  res.json({
    exists: true,
    valid: true,
    code: codeData.code,
    type: codeData.type,
    reward: codeData.reward
  });
});

// Usar código (Roblox → API)
app.post('/api/codes/:code/use', checkAuth, (req, res) => {
  const code = req.params.code.toUpperCase();
  const { player } = req.body;
  
  const codeData = codesDB.get(code);
  
  if (!codeData) {
    return res.json({ success: false, error: "Código não existe" });
  }
  
  if (codeData.used) {
    return res.json({ success: false, error: "Código já usado" });
  }
  
  // Marcar como usado
  codeData.used = true;
  codeData.usedBy = player || "Unknown";
  codeData.usedAt = Date.now();
  
  codesDB.set(code, codeData);
  
  console.log(`🎮 Código ${code} usado por ${player}`);
  
  res.json({
    success: true,
    message: "Código marcado como usado",
    reward: codeData.reward
  });
});

// Status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    codes: codesDB.size,
    server: "Replit",
    version: "1.0.0"
  });
});

// Listar todos códigos (debug)
app.get('/api/debug/codes', checkAuth, (req, res) => {
  const allCodes = [];
  
  codesDB.forEach((data, code) => {
    allCodes.push({
      code: code,
      type: data.type,
      reward: data.reward,
      used: data.used,
      usedBy: data.usedBy
    });
  });
  
  res.json({
    total: codesDB.size,
    codes: allCodes
  });
});

// Porta do Replit
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 API INICIADA NO REPLIT!
  📍 Porta: ${PORT}
  
  🔑 CHAVES GERADAS:
  Discord: ${SECRET_KEYS.DISCORD}
  Roblox:  ${SECRET_KEYS.ROBLOX}
  
  📡 ENDPOINTS:
  • POST /api/codes      - Adicionar códigos
  • GET  /api/codes/:code - Verificar código
  • POST /api/codes/:code/use - Usar código
  • GET  /api/status     - Status
  
  ⚠️ SALVE ESTAS CHAVES!
  `);
});
