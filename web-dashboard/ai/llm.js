const OpenAI = require('openai');

async function askAI(userMessage, logsData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  // Smart response types for common questions
  const msg = userMessage.toLowerCase();
  if (msg.includes('summary') || msg.includes('overview')) {
    const s = logsData.summary;
    return `System has ${s.encrypt || 0} encryptions, ${s.download || 0} downloads, ${s.decrypt || 0} decryptions. Total operations: ${s.total || 0}.`;
  }
  if (msg.includes('alert') || msg.includes('suspicious') || msg.includes('anomaly')) {
    const alerts = logsData.alerts;
    if (alerts.length === 0) return 'No suspicious activity detected in recent logs.';
    return `Detected ${alerts.length} alerts: ${alerts.map(a => a.description).join('; ')}.`;
  }
  if (msg.includes('secure') || msg.includes('security')) {
    const alerts = logsData.alerts;
    const hasRisks = alerts.length > 0;
    return hasRisks ? 
      `System has AES-256 encryption and authentication. However, ${alerts.length} potential security concerns detected. Monitoring recommended.` :
      'System is secure with AES-256 encryption, JWT authentication, and no suspicious activity detected.';
  }

  const prompt = `
You are an expert cybersecurity AI assistant.

Analyze the system based on the following data:

Logs Summary:
${JSON.stringify(logsData.summary)}

Detected Alerts:
${JSON.stringify(logsData.alerts)}

Security Score:
${JSON.stringify(logsData.score)}

Risk Prediction:
${JSON.stringify(logsData.prediction)}

Threat Simulation:
${JSON.stringify(logsData.simulation)}

User Question:
${userMessage}

Instructions:
- Explain current system status clearly
- Describe risk level and future behavior
- Mention the prediction and simulation outcome
- Recommend actions like monitoring, restricting access, or auditing
- Keep answer short, actionable, and professional
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful cybersecurity assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 400
  });

  return response.choices[0]?.message?.content?.trim() || 'Unable to generate an AI response at this time.';
}

module.exports = { askAI };