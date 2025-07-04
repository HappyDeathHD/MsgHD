const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Создаем HTTP сервер для статических файлов
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ server });

// Хранилище активных пользователей
const users = new Map();
const rooms = new Map();

// Утилита для отправки сообщения всем пользователям
function broadcast(message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// Утилита для отправки списка пользователей
function sendUsersList() {
    const usersList = Array.from(users.values()).map(user => ({
        id: user.id,
        username: user.username,
        status: user.status,
        lastSeen: user.lastSeen
    }));
    
    broadcast({
        type: 'users_list',
        users: usersList
    });
}

// Обработка WebSocket соединений
wss.on('connection', (ws) => {
    console.log('Новое подключение');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'join':
                    // Пользователь присоединяется
                    const user = {
                        id: message.userId,
                        username: message.username,
                        status: 'online',
                        lastSeen: Date.now(),
                        ws: ws
                    };
                    
                    users.set(ws, user);
                    console.log(`Пользователь ${user.username} (${user.id}) присоединился`);
                    
                    // Отправляем пользователю подтверждение
                    ws.send(JSON.stringify({
                        type: 'joined',
                        userId: user.id,
                        username: user.username
                    }));
                    
                    // Обновляем список пользователей для всех
                    sendUsersList();
                    break;
                    
                case 'message':
                    // Отправка сообщения
                    const sender = users.get(ws);
                    if (sender) {
                        const messageData = {
                            type: 'message',
                            id: Date.now() + Math.random(),
                            senderId: sender.id,
                            senderName: sender.username,
                            recipientId: message.recipientId,
                            text: message.text,
                            timestamp: Date.now()
                        };
                        
                        // Отправляем сообщение получателю и отправителю
                        const recipientWs = Array.from(users.entries())
                            .find(([ws, user]) => user.id === message.recipientId)?.[0];
                        
                        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                            recipientWs.send(JSON.stringify(messageData));
                        }
                        
                        // Подтверждение отправителю
                        ws.send(JSON.stringify(messageData));
                        
                        console.log(`Сообщение от ${sender.username} к ${message.recipientId}: ${message.text}`);
                    }
                    break;
                    
                case 'typing':
                    // Уведомление о наборе текста
                    const typingSender = users.get(ws);
                    if (typingSender) {
                        const recipientWs = Array.from(users.entries())
                            .find(([ws, user]) => user.id === message.recipientId)?.[0];
                        
                        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                            recipientWs.send(JSON.stringify({
                                type: 'typing',
                                senderId: typingSender.id,
                                isTyping: message.isTyping
                            }));
                        }
                    }
                    break;
                    
                case 'search':
                    // Поиск пользователей
                    const searchQuery = message.query.toLowerCase();
                    const results = Array.from(users.values())
                        .filter(user => 
                            user.username.toLowerCase().includes(searchQuery) ||
                            user.id.includes(searchQuery)
                        )
                        .map(user => ({
                            id: user.id,
                            username: user.username,
                            status: user.status
                        }));
                    
                    ws.send(JSON.stringify({
                        type: 'search_results',
                        results: results
                    }));
                    break;
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
        }
    });
    
    ws.on('close', () => {
        // Пользователь отключился
        const user = users.get(ws);
        if (user) {
            console.log(`Пользователь ${user.username} отключился`);
            users.delete(ws);
            sendUsersList();
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket ошибка:', error);
    });
});

// Периодическая очистка неактивных соединений
setInterval(() => {
    wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.CLOSED) {
            const user = users.get(ws);
            if (user) {
                users.delete(ws);
            }
        }
    });
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 MsgHD сервер запущен на порту ${PORT}`);
    console.log(`📱 Откройте http://localhost:${PORT} в браузере`);
    console.log(`🌐 Для доступа из сети используйте ваш IP: http://[YOUR_IP]:${PORT}`);
});
