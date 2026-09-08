import fs from 'fs';
import { Ollama } from 'ollama';
import logger from '../config/logger.js';

const ollama = new Ollama();

// Auto-discover the active model for this specific API key
async function findActiveGeminiModel(apiKey) {
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await listRes.json();

    if (!data.models || data.models.length === 0) {
      logger.warn(`No models list returned by Google: ${data.error?.message || 'Empty list'}`);
      return null;
    }

    // Filter models that support 'generateContent'
    const supported = data.models.filter((m) =>
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );

    // Prefer flash or gemini models
    const chosen =
      supported.find((m) => m.name.includes('flash')) ||
      supported.find((m) => m.name.includes('gemini')) ||
      supported[0];

    return chosen ? chosen.name : null;
  } catch (err) {
    logger.warn(`Could not fetch model list from Google: ${err.message}`);
    return null;
  }
}

export const extractBillData = async (imagePath) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Read local image buffer
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Analyze this bill or receipt image carefully and extract all product and warranty details.
Return ONLY a valid JSON object without markdown formatting, code blocks (\`\`\`json), or any extra explanation.

JSON Structure:
{
  "productName": "string or main product name",
  "productModel": "string or null",
  "category": "Electronics, Grocery, Appliance, Medical, etc., or null",
  "quantity": 1,
  "purchaseDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "manufacturingDate": "YYYY-MM-DD or null",
  "warrantyPeriod": "e.g. '2 years' or null",
  "warrantyEndDate": "YYYY-MM-DD or null",
  "price": number or null,
  "tax": number or null,
  "totalPrice": number or null,
  "vendorName": "store name or null",
  "vendorAddress": "store address or null",
  "vendorPhone": "phone or null",
  "billNumber": "bill/invoice number or null",
  "paymentMethod": "UPI, Card, Cash, etc., or null"
}`;

  // ─── TRY GOOGLE GEMINI (AUTO-DISCOVERY) ───
  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_')) {
    try {
      logger.info('🔍 Finding available Gemini model for your API key...');
      const modelName = await findActiveGeminiModel(apiKey);

      if (modelName) {
        logger.info(`🤖 Using discovered model: [${modelName}]`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: base64Image
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        const result = await response.json();

        if (response.ok) {
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          const jsonMatch = rawText?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            logger.info(`✅ Google AI Extraction Successful: ${parsed.productName}`);
            return parsed;
          }
        } else {
          logger.warn(`Google AI call failed: ${result.error?.message}. Switching to local Ollama.`);
        }
      }
    } catch (googleErr) {
      logger.warn(`Google AI Error (${googleErr.message}). Switching to local Ollama.`);
    }
  }

  // ─── SAFE FALLBACK: LOCAL OLLAMA (ALWAYS WORKS) ───
  logger.info('🤖 Analyzing bill with local Ollama (Llava)...');
  const ollamaResponse = await ollama.chat({
    model: process.env.OLLAMA_MODEL || 'llava',
    messages: [
      {
        role: 'user',
        content: `Extract bill details as raw JSON: productName, productModel, category, quantity, purchaseDate (YYYY-MM-DD), expiryDate, warrantyPeriod, warrantyEndDate, price, totalPrice, vendorName, billNumber, paymentMethod. Return ONLY valid JSON.`,
        images: [base64Image]
      }
    ]
  });

  const jsonMatch = ollamaResponse.message.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Local Ollama response did not contain valid JSON');
  
  const parsedOllama = JSON.parse(jsonMatch[0]);
  logger.info(`✅ Local Ollama Extraction Successful: ${parsedOllama.productName}`);
  return parsedOllama;
};