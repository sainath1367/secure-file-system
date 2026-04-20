const { summarizeLogs } = require('./summary');
const { detectAnomalies } = require('./anomaly');

function simulateThreat(logPath) {
  const summary = summarizeLogs(logPath);
  const alerts = detectAnomalies(logPath);

  const scenario = alerts.some(a => a.severity === 'HIGH')
    ? 'If this pattern continues, an insider threat may progress from mass downloads to unauthorized key extraction.'
    : 'The current behavior is stable, but repeated high-volume downloads could lead to data exfiltration.';

  const impact = alerts.some(a => a.type === 'key_theft_suspicion')
    ? 'Potential compromise of encryption keys and unauthorized access to protected content.'
    : summary.download > 25
    ? 'Sensitive file transfer risk and elevated data exfiltration potential.'
    : 'Normal operation with standard risk levels.';

  const prevention = alerts.some(a => a.severity === 'HIGH')
    ? 'Immediately restrict user access, audit recent downloads, and rotate affected keys.'
    : 'Continue monitoring activity, enforce least privilege, and verify user intent before granting new downloads.';

  return {
    simulation: scenario,
    impact,
    prevention,
    severity: alerts.length > 0 ? 'ELEVATED' : 'NORMAL',
    summary: {
      downloads: summary.download,
      encryptions: summary.encrypt,
      alerts: alerts.length
    }
  };
}

module.exports = { simulateThreat };