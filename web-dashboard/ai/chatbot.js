const { summarizeLogs, getFormattedSummary } = require('./summary');
const { detectAnomalies, getAnomalyStats } = require('./anomaly');

/**
 * AI Security Assistant - responds to natural language queries
 */
function getResponse(message, logPath) {
    message = message.toLowerCase().trim();

    // Intent: Summary/Statistics
    if (message.includes('summary') || message.includes('today') || message.includes('stats') || message.includes('activities')) {
        const summary = getFormattedSummary(logPath);
        return {
            type: 'summary',
            summary: summary.formatted,
            data: summary
        };
    }

    // Intent: Security/Threats
    if (message.includes('suspicious') || message.includes('threat') || message.includes('anomal') || message.includes('security')) {
        const stats = getAnomalyStats(logPath);
        if (stats.totalAlerts === 0) {
            return {
                type: 'security',
                message: '✅ System Status: No suspicious activity detected. All systems secure!',
                alerts: []
            };
        }
        const alertSummary = stats.alerts
            .map(a => `• ${a.message}`)
            .join('\n');
        
        return {
            type: 'security',
            message: `🔴 **SECURITY ALERTS** (${stats.totalAlerts} total)\n\n${alertSummary}`,
            data: stats
        };
    }

    // Intent: Encryption information
    if (message.includes('encrypt') || message.includes('encryption')) {
        return {
            type: 'info',
            message: '🔐 **Encryption System**\n' +
                     '• Algorithm: AES-256-GCM\n' +
                     '• Mode: Authenticated Encryption\n' +
                     '• Key Size: 256-bit (32 bytes)\n' +
                     '• Authentication: GCM Tag\n' +
                     '• Security Level: Military-grade'
        };
    }

    // Intent: Authentication information
    if (message.includes('auth') || message.includes('security') || message.includes('login')) {
        return {
            type: 'info',
            message: '🔑 **Authentication & Security**\n' +
                     '• Method: Google OAuth 2.0\n' +
                     '• Token Type: JWT (JSON Web Token)\n' +
                     '• Expiration: 24 hours\n' +
                     '• Transport: HTTPS\n' +
                     '• Sessions: Secure & HttpOnly Cookies'
        };
    }

    // Intent: User/Account help
    if (message.includes('user') || message.includes('profile') || message.includes('account')) {
        return {
            type: 'help',
            message: '👤 **User Management**\n' +
                     '• Login: Google OAuth integration\n' +
                     '• Profile: View your information\n' +
                     '• Sessions: Automatically managed\n' +
                     '• Data: Encrypted per user'
        };
    }

    // Intent: File operations
    if (message.includes('file') || message.includes('upload') || message.includes('download')) {
        return {
            type: 'help',
            message: '📁 **File Operations**\n' +
                     '• Upload: Select file or paste text\n' +
                     '• Encrypt: Click "Encrypt" button\n' +
                     '• Download: Get encrypted file & key\n' +
                     '• Decrypt: Upload encrypted file with key\n' +
                     '• All files automatically tracked in audit logs'
        };
    }

    // Intent: Help/Support
    if (message.includes('help') || message.includes('how') || message.includes('what')) {
        return {
            type: 'help',
            message: '❓ **How Can I Help?**\n' +
                     'Try asking about:\n' +
                     '• "What is my summary today?"\n' +
                     '• "Are there any suspicious activities?"\n' +
                     '• "How does encryption work?"\n' +
                     '• "Tell me about security"\n' +
                     '• "How do I encrypt files?"'
        };
    }

    // Default: General greeting and help
    return {
        type: 'greeting',
        message: '👋 **AI Security Assistant**\n' +
                 'I can help you with:\n' +
                 '✓ Activity summaries\n' +
                 '✓ Security alerts\n' +
                 '✓ System information\n' +
                 '✓ File operations help\n\n' +
                 'What would you like to know?'
    };
}

/**
 * Batch multiple questions
 */
function batchResponses(messages, logPath) {
    return messages.map(msg => ({
        question: msg,
        response: getResponse(msg, logPath)
    }));
}

module.exports = { 
    getResponse,
    batchResponses
};
