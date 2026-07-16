const Paste = require('../models/Paste');

// Send message back to Telegram
async function sendMessage(chatId, text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                disable_web_page_preview: true
            })
        });
    } catch (e) {
        console.error('Telegram sendMessage error:', e);
    }
}

exports.webhook = async (req, res) => {
    // Acknowledge the webhook immediately so Telegram doesn't retry
    res.status(200).send('OK');

    try {
        const update = req.body;
        if (!update || !update.message) return;

        const message = update.message;
        const text = message.text || '';
        
        // Command check
        if (text.startsWith('/paste')) {
            // Must be a reply
            if (!message.reply_to_message) {
                await sendMessage(message.chat.id, "Please reply to a message with /paste to create a snippet.");
                return;
            }

            const codeToPaste = message.reply_to_message.text || message.reply_to_message.caption;
            
            if (!codeToPaste) {
                await sendMessage(message.chat.id, "The replied message doesn't contain any text.");
                return;
            }

            // Create the paste (using "auto" language)
            const paste = new Paste({ 
                content: codeToPaste,
                language: 'auto',
                expiresAt: null
            });
            await paste.save();

            const url = `https://${req.get('host')}/#/paste/${paste.slug}`;
            await sendMessage(message.chat.id, `✅ Paste created!\n${url}`);
        }
    } catch (error) {
        console.error('Telegram webhook error:', error);
    }
};

exports.setup = async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        return res.status(400).send('TELEGRAM_BOT_TOKEN not found in environment variables.');
    }
    
    // Fallback to Vercel domain if request host is localhost or missing
    let host = req.get('host');
    if (host.includes('localhost') && process.env.VERCEL_URL) {
        host = process.env.VERCEL_URL;
    }
    
    const webhookUrl = `https://${host}/api/telegram-webhook`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const data = await response.json();
        res.json({
            success: data.ok,
            message: data.description,
            webhook_url: webhookUrl
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
