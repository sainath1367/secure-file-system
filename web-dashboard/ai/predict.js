const { summarizeLogs, getActivityTrend } = require('./summary');

function predictRisk(logPath) {
  const summary = summarizeLogs(logPath);
  const trend = getActivityTrend(logPath, 6);
  const recent = trend.slice(-3);
  const recentDownloads = recent.reduce((sum, item) => sum + item.download, 0);
  const recentEncrypts = recent.reduce((sum, item) => sum + item.encrypt, 0);

  let riskScore = 0;
  if (summary.download > 15) riskScore += 30;
  if (summary.download > 30) riskScore += 25;
  if (recentDownloads > 8) riskScore += 20;
  if (summary.encrypt > 25) riskScore += 10;
  if (recentEncrypts > 10) riskScore += 10;
  if (summary.uniqueUsers > 3 && summary.download > 12) riskScore += 5;

  const risk = riskScore >= 70 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW';

  const message =
    risk === 'HIGH'
      ? 'High probability of suspicious activity in the next 10 minutes. Review recent downloads and restrict access if needed.'
      : risk === 'MEDIUM'
      ? 'Moderate risk: unusual access patterns detected. Increase logging and monitor users closely.'
      : 'Low risk: current behavior remains within expected boundaries.';

  return {
    risk,
    score: riskScore,
    message,
    details: {
      downloads: summary.download,
      recentDownloads,
      encryptions: summary.encrypt,
      trend: recent
    }
  };
}

module.exports = { predictRisk };