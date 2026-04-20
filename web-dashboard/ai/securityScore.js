const { summarizeLogs } = require('./summary');
const { detectAnomalies } = require('./anomaly');

function calculateSecurityScore(logPath) {
  const summary = summarizeLogs(logPath);
  const alerts = detectAnomalies(logPath);

  let score = 100;
  score -= Math.min(alerts.length * 18, 60);
  score -= Math.min(Math.max(summary.download - 15, 0) * 1.5, 25);
  score -= Math.min(Math.max(summary.encrypt - 40, 0) * 1, 10);
  if (summary.total > 40) score -= 5;
  if (summary.uniqueUsers > 5 && summary.download > 10) score -= 5;
  if (score < 0) score = 0;

  const level = score > 80 ? 'SAFE' : score > 50 ? 'MEDIUM' : 'HIGH RISK';
  const color = score > 80 ? '#22c55e' : score > 50 ? '#f59e0b' : '#ef4444';

  return {
    score,
    level,
    color,
    explanation: `Based on ${alerts.length} alert(s), ${summary.download} downloads, ${summary.encrypt} encryptions, and ${summary.uniqueUsers} active users.`,
    alertsCount: alerts.length
  };
}

module.exports = { calculateSecurityScore };