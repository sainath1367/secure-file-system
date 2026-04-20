const fs = require('fs');
const path = require('path');

/**
 * Parse audit logs and extract user activity statistics
 */
function parseLogs(filePath) {
    if (!fs.existsSync(filePath)) return {};

    try {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
        const userActivity = {};

        lines.forEach(line => {
            // Format: [2026-02-14T10:30:00Z] user@gmail.com | ENCRYPT | filename
            const match = line.match(/\](.*?)\|/);
            if (!match) return;

            const user = match[1].trim();
            const actionMatch = line.match(/\|\s*(.*?)\s*\|/);
            if (!actionMatch) return;

            const action = actionMatch[1].trim();

            if (!userActivity[user]) {
                userActivity[user] = { 
                    encrypt: 0, 
                    decrypt: 0, 
                    download: 0,
                    downloadEncrypted: 0,
                    downloadKey: 0,
                    total: 0
                };
            }

            userActivity[user].total++;

            if (action.includes('ENCRYPT')) userActivity[user].encrypt++;
            if (action.includes('DECRYPT')) userActivity[user].decrypt++;
            if (action === 'DOWNLOAD') userActivity[user].download++;
            if (action === 'DOWNLOAD_ENCRYPTED') userActivity[user].downloadEncrypted++;
            if (action === 'DOWNLOAD_KEY') userActivity[user].downloadKey++;
        });

        return userActivity;
    } catch (err) {
        console.error('Error parsing logs:', err);
        return {};
    }
}

/**
 * Detect anomalies in user behavior
 * Returns array of security alerts
 */
function detectAnomalies(logPath) {
    const data = parseLogs(logPath);
    const alerts = [];

    for (let user in data) {
        const activity = data[user];

        // Rule 1: Excessive downloads might indicate data exfiltration
        if (activity.downloadEncrypted + activity.download > 15) {
            alerts.push({
                severity: 'HIGH',
                message: `🚨 SUSPICIOUS: User ${user} attempted ${activity.downloadEncrypted + activity.download} downloads (threshold: 15)`,
                user,
                type: 'excessive_downloads'
            });
        }

        // Rule 2: Too many encryptions in short period
        if (activity.encrypt > 20) {
            alerts.push({
                severity: 'MEDIUM',
                message: `⚠️ WARNING: User ${user} performed ${activity.encrypt} encryption operations (threshold: 20)`,
                user,
                type: 'excessive_encryption'
            });
        }

        // Rule 3: Unusual decrypt-to-download ratio (potential unauthorized access)
        const totalDownloads = activity.downloadEncrypted + activity.download;
        if (activity.decrypt > 0 && totalDownloads / activity.decrypt > 3) {
            alerts.push({
                severity: 'MEDIUM',
                message: `⚠️ ALERT: User ${user} has unusual download-to-decrypt ratio (${totalDownloads}:${activity.decrypt})`,
                user,
                type: 'unusual_pattern'
            });
        }

        // Rule 4: Lone key downloads might indicate key theft attempt
        if (activity.downloadKey > 3 && activity.decrypt === 0) {
            alerts.push({
                severity: 'HIGH',
                message: `🚨 CRITICAL: User ${user} downloaded ${activity.downloadKey} keys without decryption attempts`,
                user,
                type: 'key_theft_suspicion'
            });
        }
    }

    return alerts;
}

/**
 * Get anomaly statistics for dashboard
 */
function getAnomalyStats(logPath) {
    const alerts = detectAnomalies(logPath);
    const data = parseLogs(logPath);

    return {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'HIGH').length,
        mediumAlerts: alerts.filter(a => a.severity === 'MEDIUM').length,
        alerts: alerts.slice(0, 10), // Return top 10 alerts
        usersMonitored: Object.keys(data).length,
        timestamp: new Date().toISOString()
    };
}

module.exports = { 
    detectAnomalies, 
    getAnomalyStats, 
    parseLogs 
};
