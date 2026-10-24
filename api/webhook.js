const SYSTEM_PROMPT = `Eres el asistente personal de Alejandro, dueño de "El Horno de Alejo", repostería natural en Buga, Colombia (sin azúcar refinada, sin gluten).
Contexto del negocio: trufas $3.500 c/u o caja de 4 por $15.000; tortas premium desde $118.000; horneamos de noche en horno eléctrico; proveedores locales en Buga.
Responde en español, corto, cercano y sin emojis exagerados. Si no sabes algo, dilo honestamente.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Jarvis OK');
  const msg = req.body?.message;
  if (!msg?.text) return res.status(200).send('OK');

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/start') {
    await sendTelegram(chatId, 'Hola 👋 Soy Jarvis, el asistente de El Horno de Alejo. Escríbeme lo que necesites: precios, pedidos, recordatorios...');
    return res.status(200).send('OK');
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nMensaje del usuario: ${text}` }] }]
        })
      }
    );
    const data = await gRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar respuesta, intenta de nuevo.';
    await sendTelegram(chatId, reply);
  } catch (e) {
    await sendTelegram(chatId, 'Error procesando tu mensaje: ' + e.message);
  }
  res.status(200).send('OK');
}

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
