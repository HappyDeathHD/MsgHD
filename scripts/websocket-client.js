// WebSocket client for MsgHD messenger with real server connection
class MsgHDWebSocketClient extends Utils.EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.isConnected = false;
        this.userId = null;
        this.username = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.onlineUsers = new Map();
        this.currentChatUserId = null;
        
        this.init();
    }

    init() {
        // Пытаемся подключиться к WebSocket серверу
        this.connect();
    }

    connect() {
        try {
            // Определяем URL WebSocket сервера
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            
            let wsUrl;
            if (host) {
                // Если приложение открыто через веб-сервер
                wsUrl = `${protocol}//${host}`;
            } else {
                // Если открыто как файл, пробуем localhost
                wsUrl = 'ws://localhost:3000';
            }
            
            console.log('Подключение к WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket подключен');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Если пользователь уже авторизован, отправляем данные
                const currentUser = JSON.parse(localStorage.getItem('msghd-user') || '{}');
                if (currentUser.id && currentUser.username) {
                    this.joinChat(currentUser.id, currentUser.username);
                }
                
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Ошибка парсинга сообщения:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket отключен');
                this.isConnected = false;
                this.emit('disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket ошибка:', error);
                this.emit('connection_error', error);
            };
            
        } catch (error) {
            console.error('Ошибка создания WebSocket:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Не удалось подключиться к серверу');
            this.emit('connection_failed');
            // Fallback на локальную версию
            this.initLocalFallback();
        }
    }

    initLocalFallback() {
        console.log('Переключение на локальный режим (BroadcastChannel)');
        // Здесь можно добавить логику для работы в локальном режиме
        // используя существующий MessengerWebSocket
        if (window.MessengerWS) {
            this.emit('fallback_activated');
        }
    }

    joinChat(userId, username) {
        this.userId = userId;
        this.username = username;
        
        if (this.isConnected && this.ws) {
            this.send({
                type: 'join',
                userId: userId,
                username: username
            });
        }
    }

    send(data) {
        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket не подключен, сообщение не отправлено:', data);
        }
    }

    handleMessage(data) {
        console.log('Получено сообщение:', data);
        
        switch (data.type) {
            case 'joined':
                this.emit('joined', data);
                break;
                
            case 'users_list':
                this.updateOnlineUsers(data.users);
                this.emit('users_list_updated', data.users);
                break;
                
            case 'message':
                this.emit('chat_message', {
                    id: data.id,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    recipientId: data.recipientId,
                    text: data.text,
                    timestamp: data.timestamp,
                    fromUserId: data.senderId,
                    fromNickname: data.senderName,
                    targetUserId: data.recipientId,
                    message: data.text
                });
                break;
                
            case 'typing':
                this.emit(data.isTyping ? 'typing_start' : 'typing_stop', {
                    fromUserId: data.senderId,
                    targetUserId: this.userId
                });
                break;
                
            case 'search_results':
                this.emit('search_results', data.results);
                break;
                
            default:
                console.log('Неизвестный тип сообщения:', data.type);
        }
    }

    updateOnlineUsers(users) {
        this.onlineUsers.clear();
        users.forEach(user => {
            if (user.id !== this.userId) { // Не добавляем себя
                this.onlineUsers.set(user.id, {
                    userId: user.id,
                    nickname: user.username,
                    status: user.status || 'online',
                    lastSeen: user.lastSeen || Date.now()
                });
            }
        });
    }

    // Методы API для совместимости с существующим кодом
    sendChatMessage(targetUserId, message) {
        this.send({
            type: 'message',
            recipientId: targetUserId,
            text: message
        });
    }

    sendTyping(targetUserId, isTyping) {
        this.send({
            type: 'typing',
            recipientId: targetUserId,
            isTyping: isTyping
        });
    }

    searchUsers(query) {
        this.send({
            type: 'search',
            query: query
        });
    }

    getOnlineUsers() {
        return Array.from(this.onlineUsers.values());
    }

    isConnectionActive() {
        return this.isConnected;
    }

    getUserInfo() {
        return {
            userId: this.userId,
            nickname: this.username,
            connected: this.isConnected
        };
    }

    disconnect() {
        if (this.ws) {
            this.isConnected = false;
            this.ws.close();
        }
    }
}

// Создаем глобальный экземпляр WebSocket клиента
window.MsgHDClient = new MsgHDWebSocketClient();

// Обновляем глобальный API для совместимости
window.WebSocketManager = {
    connect: (nickname, userId) => {
        // Сохраняем данные пользователя
        localStorage.setItem('msghd-user', JSON.stringify({
            id: userId,
            username: nickname
        }));
        
        // Подключаемся через новый клиент если доступен
        if (window.MsgHDClient.isConnectionActive()) {
            window.MsgHDClient.joinChat(userId, nickname);
        } else {
            // Fallback на старый клиент
            window.MessengerWS.connect(nickname, userId);
        }
    },
    
    disconnect: () => {
        window.MsgHDClient.disconnect();
        window.MessengerWS.disconnect();
    },
    
    sendChatMessage: (targetUserId, message) => {
        if (window.MsgHDClient.isConnectionActive()) {
            window.MsgHDClient.sendChatMessage(targetUserId, message);
        } else {
            window.MessengerWS.sendChatMessage(targetUserId, message);
        }
    },
    
    sendTyping: (targetUserId, isTyping) => {
        if (window.MsgHDClient.isConnectionActive()) {
            window.MsgHDClient.sendTyping(targetUserId, isTyping);
        } else {
            window.MessengerWS.sendTyping(targetUserId, isTyping);
        }
    },
    
    searchUsers: (query) => {
        if (window.MsgHDClient.isConnectionActive()) {
            window.MsgHDClient.searchUsers(query);
        } else {
            window.MessengerWS.searchUsers(query);
        }
    },
    
    getOnlineUsers: () => {
        if (window.MsgHDClient.isConnectionActive()) {
            return window.MsgHDClient.getOnlineUsers();
        } else {
            return window.MessengerWS.getOnlineUsers();
        }
    },
    
    isConnected: () => {
        return window.MsgHDClient.isConnectionActive() || window.MessengerWS.isConnectionActive();
    },
    
    getUserInfo: () => {
        if (window.MsgHDClient.isConnectionActive()) {
            return window.MsgHDClient.getUserInfo();
        } else {
            return window.MessengerWS.getUserInfo();
        }
    },
    
    // Event handling - подключаем к обоим клиентам
    on: (event, callback) => {
        window.MsgHDClient.on(event, callback);
        window.MessengerWS.on(event, callback);
    },
    
    off: (event, callback) => {
        window.MsgHDClient.off(event, callback);
        window.MessengerWS.off(event, callback);
    },
    
    once: (event, callback) => {
        window.MsgHDClient.once(event, callback);
        window.MessengerWS.once(event, callback);
    }
};

// Обработка событий подключения для уведомления пользователя
window.MsgHDClient.on('connected', () => {
    console.log('🌐 Подключен к серверу - теперь можно общаться с пользователями из других сетей!');
});

window.MsgHDClient.on('connection_failed', () => {
    console.log('⚠️ Не удалось подключиться к серверу - работаем в локальном режиме');
});

window.MsgHDClient.on('fallback_activated', () => {
    console.log('🔄 Переключен на локальный режим - общение только между вкладками этого браузера');
});
