const fs = require('fs');

/**
 * Summarize audit logs with activity counts and statistics
 */
function summarizeLogs(filePath) {
    if (!fs.existsSync(filePath)) {
        return {
            encrypt: 0,
            decrypt: 0,
            download: 0,
            downloadEncrypted: 0,
            downloadKey: 0,
            total: 0,
            uniqueUsers: 0,
            timestamp: new Date().toISOString()
        };
    }

    try {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
        let encrypt = 0, decrypt = 0, download = 0, downloadEncrypted = 0, downloadKey = 0;
        const uniqueUsers = new Set();

        lines.forEach(line => {
            // Parse: [2026-02-14T10:30:00Z] user@gmail.com | ACTION | target
            const userMatch = line.match(/\](.*?)\|/);
            if (userMatch) {
                uniqueUsers.add(userMatch[1].trim());
            }

            if (line.includes('ENCRYPT')) encrypt++;
            else if (line.includes('DECRYPT')) decrypt++;
            else if (line.includes('DOWNLOAD_ENCRYPTED')) downloadEncrypted++;
            else if (line.includes('DOWNLOAD_KEY')) downloadKey++;
            else if (line.includes('DOWNLOAD')) download++;
        });

        return {
            encrypt,
            decrypt,
            download,
            downloadEncrypted,
            downloadKey,
            total: lines.length,
            uniqueUsers: uniqueUsers.size,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error('Error summarizing logs:', err);
        return {
            encrypt: 0,
            decrypt: 0,
            download: 0,
            downloadEncrypted: 0,
            downloadKey: 0,
            total: 0,
            uniqueUsers: 0,
            error: err.message
        };
    }
}

/**
 * Get summary formatted for display
 */
function getFormattedSummary(filePath) {
    const summary = summarizeLogs(filePath);
    
    return {
        ...summary,
        formatted: `📊 **Today's Activity Summary**\n` +
                   `• Encryptions: ${summary.encrypt}🔒\n` +
                   `• Decryptions: ${summary.decrypt}🔓\n` +
                   `• Downloads: ${summary.download}⬇️\n` +
                   `• Key Downloads: ${summary.downloadKey}🔑\n` +
                   `• Total Operations: ${summary.total}\n` +
                   `• Active Users: ${summary.uniqueUsers}👥`
    };
}

/**
 * Get activity trend (last N hours)
 */
function getActivityTrend(filePath, hours = 24) {
    if (!fs.existsSync(filePath)) return [];

    try {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        const hourlyStats = {};
        
        lines.forEach(line => {
            const timeMatch = line.match(/\[([^\]]+)\]/);
            if (!timeMatch) return;
            
            const timestamp = new Date(timeMatch[1]);
            if (timestamp < cutoffTime) return;
            
            const hour = timestamp.toISOString().substring(0, 13) + ':00:00Z';
            if (!hourlyStats[hour]) {
                hourlyStats[hour] = { encrypt: 0, decrypt: 0, download: 0, total: 0 };
            }
            
            hourlyStats[hour].total++;
            if (line.includes('ENCRYPT')) hourlyStats[hour].encrypt++;
            if (line.includes('DECRYPT')) hourlyStats[hour].decrypt++;
            if (line.includes('DOWNLOAD')) hourlyStats[hour].download++;
        });
        
        return Object.entries(hourlyStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hour, stats]) => ({ hour, ...stats }));
    } catch (err) {
        console.error('Error getting trend:', err);
        return [];
    }
}

module.exports = { 
    summarizeLogs, 
    getFormattedSummary,
    getActivityTrend 
};
