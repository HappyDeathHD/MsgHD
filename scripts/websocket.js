// WebSocket communication for MsgHD messenger
// Since we can't use a real WebSocket server for GitHub Pages,
// we'll simulate P2P communication using BroadcastChannel API

class MessengerWebSocket extends Utils.EventEmitter {
    constructor() {
        super();
        this.isConnected = false;
        this.userId = null;
        this.nickname = null;
        this.channel = null;
        this.onlineUsers = new Map();
        this.heartbeatInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.initBroadcastChannel();
    }

    /**
     * Initialize BroadcastChannel for cross-tab communication
     */
    initBroadcastChannel() {
        try {
            // Use BroadcastChannel to simulate real-time communication
            this.channel = new BroadcastChannel('msghd-messenger');
            this.channel.addEventListener('message', this.handleMessage.bind(this));
            
            // Listen for tab/window close to cleanup
            window.addEventListener('beforeunload', this.disconnect.bind(this));
            
            // Listen for visibility changes to manage presence
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
            
            console.log('BroadcastChannel initialized');
        } catch (error) {
            console.error('Failed to initialize BroadcastChannel:', error);
            this.fallbackToLocalStorage();
        }
    }

    /**
     * Fallback to localStorage for browsers without BroadcastChannel support
     */
    fallbackToLocalStorage() {
        console.log('Falling back to localStorage communication');
        
        // Use localStorage events for cross-tab communication
        window.addEventListener('storage', (e) => {
            if (e.key === 'msghd-messages' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    this.handleMessage({ data });
                    
                    // Clear the message to prevent duplicate handling
                    setTimeout(() => {
                        localStorage.removeItem('msghd-messages');
                    }, 100);
                } catch (error) {
                    console.error('Error parsing localStorage message:', error);
                }
            }
        });
    }

    /**
     * Connect to the "network" (simulate connection)
     * @param {string} nickname - User nickname
     * @param {string} userId - User ID
     */
    connect(nickname, userId) {
        this.nickname = nickname;
        this.userId = userId;
        
        try {
            // Simulate connection
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Announce presence
            this.sendMessage({
                type: 'user_joined',
                userId: this.userId,
                nickname: this.nickname,
                timestamp: Date.now()
            });
            
            // Start heartbeat to maintain presence
            this.startHeartbeat();
            
            // Check for existing users
            this.requestOnlineUsers();
            
            this.emit('connected');
            console.log(`Connected as ${nickname} (${userId})`);
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.emit('connection_error', error);
        }
    }

    /**
     * Disconnect from the network
     */
    disconnect() {
        if (!this.isConnected) return;
        
        try {
            // Announce departure
            this.sendMessage({
                type: 'user_left',
                userId: this.userId,
                nickname: this.nickname,
                timestamp: Date.now()
            });
            
            this.stopHeartbeat();
            this.isConnected = false;
            
            if (this.channel) {
                this.channel.close();
            }
            
            this.emit('disconnected');
            console.log('Disconnected from messenger');
            
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Send a message through the communication channel
     * @param {Object} data - Message data
     */
    sendMessage(data) {
        if (!this.isConnected && data.type !== 'user_left') {
            console.warn('Not connected, cannot send message');
            return;
        }

        try {
            const message = {
                ...data,
                fromUserId: this.userId,
                fromNickname: this.nickname,
                id: Utils.generateUUID(),
                timestamp: data.timestamp || Date.now()
            };

            if (this.channel) {
                this.channel.postMessage(message);
            } else {
                // Fallback to localStorage
                localStorage.setItem('msghd-messages', JSON.stringify(message));
            }
            
            console.log('Message sent:', message.type);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.emit('send_error', error);
        }
    }

    /**
     * Handle incoming messages
     * @param {MessageEvent} event - Message event
     */
    handleMessage(event) {
        try {
            const data = event.data;
            
            // Ignore messages from self
            if (data.fromUserId === this.userId) {
                return;
            }
            
            console.log('Message received:', data.type, data);
            
            switch (data.type) {
                case 'user_joined':
                    this.handleUserJoined(data);
                    break;
                    
                case 'user_left':
                    this.handleUserLeft(data);
                    break;
                    
                case 'heartbeat':
                    this.handleHeartbeat(data);
                    break;
                    
                case 'request_online_users':
                    this.handleOnlineUsersRequest(data);
                    break;
                    
                case 'online_users_response':
                    this.handleOnlineUsersResponse(data);
                    break;
                    
                case 'chat_message':
                    this.handleChatMessage(data);
                    break;
                    
                case 'typing_start':
                    this.handleTypingStart(data);
                    break;
                    
                case 'typing_stop':
                    this.handleTypingStop(data);
                    break;
                    
                case 'user_search':
                    this.handleUserSearch(data);
                    break;
                    
                case 'user_search_response':
                    this.handleUserSearchResponse(data);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    /**
     * Handle user joined event
     * @param {Object} data - User data
     */
    handleUserJoined(data) {
        this.onlineUsers.set(data.userId, {
            userId: data.userId,
            nickname: data.nickname,
            lastSeen: data.timestamp,
            status: 'online'
        });
        
        this.emit('user_joined', data);
        
        // Send our presence back
        this.sendMessage({
            type: 'heartbeat',
            status: 'online'
        });
    }

    /**
     * Handle user left event
     * @param {Object} data - User data
     */
    handleUserLeft(data) {
        this.onlineUsers.delete(data.userId);
        this.emit('user_left', data);
    }

    /**
     * Handle heartbeat (presence) message
     * @param {Object} data - Heartbeat data
     */
    handleHeartbeat(data) {
        if (this.onlineUsers.has(data.fromUserId)) {
            const user = this.onlineUsers.get(data.fromUserId);
            user.lastSeen = data.timestamp;
            user.status = data.status || 'online';
            this.onlineUsers.set(data.fromUserId, user);
        } else {
            // Add new user
            this.onlineUsers.set(data.fromUserId, {
                userId: data.fromUserId,
                nickname: data.fromNickname,
                lastSeen: data.timestamp,
                status: data.status || 'online'
            });
            
            this.emit('user_joined', {
                userId: data.fromUserId,
                nickname: data.fromNickname
            });
        }
        
        this.emit('user_presence', {
            userId: data.fromUserId,
            status: data.status || 'online'
        });
    }

    /**
     * Handle request for online users
     * @param {Object} data - Request data
     */
    handleOnlineUsersRequest(data) {
        // Respond with our info
        this.sendMessage({
            type: 'online_users_response',
            targetUserId: data.fromUserId,
            users: [{
                userId: this.userId,
                nickname: this.nickname,
                status: 'online'
            }]
        });
    }

    /**
     * Handle online users response
     * @param {Object} data - Response data
     */
    handleOnlineUsersResponse(data) {
        if (data.targetUserId !== this.userId) return;
        
        data.users.forEach(user => {
            this.onlineUsers.set(user.userId, {
                ...user,
                lastSeen: Date.now()
            });
        });
        
        this.emit('online_users_updated', Array.from(this.onlineUsers.values()));
    }

    /**
     * Handle chat message
     * @param {Object} data - Message data
     */
    handleChatMessage(data) {
        this.emit('chat_message', data);
    }

    /**
     * Handle typing start
     * @param {Object} data - Typing data
     */
    handleTypingStart(data) {
        this.emit('typing_start', data);
    }

    /**
     * Handle typing stop
     * @param {Object} data - Typing data
     */
    handleTypingStop(data) {
        this.emit('typing_stop', data);
    }

    /**
     * Handle user search request
     * @param {Object} data - Search data
     */
    handleUserSearch(data) {
        const query = data.query.toLowerCase();
        const matches = this.nickname.toLowerCase().includes(query) || 
                       this.userId.toLowerCase().includes(query);
        
        if (matches) {
            this.sendMessage({
                type: 'user_search_response',
                targetUserId: data.fromUserId,
                query: data.query,
                user: {
                    userId: this.userId,
                    nickname: this.nickname,
                    status: 'online'
                }
            });
        }
    }

    /**
     * Handle user search response
     * @param {Object} data - Search response data
     */
    handleUserSearchResponse(data) {
        if (data.targetUserId !== this.userId) return;
        
        this.emit('search_result', {
            query: data.query,
            user: data.user
        });
    }

    /**
     * Send chat message
     * @param {string} targetUserId - Target user ID
     * @param {string} message - Message text
     */
    sendChatMessage(targetUserId, message) {
        this.sendMessage({
            type: 'chat_message',
            targetUserId: targetUserId,
            message: message,
            timestamp: Date.now()
        });
    }

    /**
     * Send typing indicator
     * @param {string} targetUserId - Target user ID
     * @param {boolean} isTyping - Typing status
     */
    sendTyping(targetUserId, isTyping) {
        this.sendMessage({
            type: isTyping ? 'typing_start' : 'typing_stop',
            targetUserId: targetUserId
        });
    }

    /**
     * Search for users
     * @param {string} query - Search query
     */
    searchUsers(query) {
        if (query.length < 2) return;
        
        this.sendMessage({
            type: 'user_search',
            query: query
        });
    }

    /**
     * Request list of online users
     */
    requestOnlineUsers() {
        this.sendMessage({
            type: 'request_online_users'
        });
    }

    /**
     * Get online users list
     * @returns {Array} Array of online users
     */
    getOnlineUsers() {
        return Array.from(this.onlineUsers.values());
    }

    /**
     * Start heartbeat to maintain presence
     */
    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendMessage({
                    type: 'heartbeat',
                    status: document.hidden ? 'away' : 'online'
                });
                
                // Clean up stale users (not seen for 30 seconds)
                const staleThreshold = Date.now() - 30000;
                for (const [userId, user] of this.onlineUsers.entries()) {
                    if (user.lastSeen < staleThreshold) {
                        this.onlineUsers.delete(userId);
                        this.emit('user_left', { userId, nickname: user.nickname });
                    }
                }
            }
        }, 10000); // Send heartbeat every 10 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Handle visibility change (tab switch)
     */
    handleVisibilityChange() {
        if (this.isConnected) {
            this.sendMessage({
                type: 'heartbeat',
                status: document.hidden ? 'away' : 'online'
            });
        }
    }

    /**
     * Get connection status
     * @returns {boolean} Connection status
     */
    isConnectionActive() {
        return this.isConnected;
    }

    /**
     * Get user info
     * @returns {Object} User information
     */
    getUserInfo() {
        return {
            userId: this.userId,
            nickname: this.nickname,
            connected: this.isConnected
        };
    }
}

// Create global WebSocket instance
window.MessengerWS = new MessengerWebSocket();

// Export for use in other scripts
window.WebSocketManager = {
    connect: (nickname, userId) => window.MessengerWS.connect(nickname, userId),
    disconnect: () => window.MessengerWS.disconnect(),
    sendChatMessage: (targetUserId, message) => window.MessengerWS.sendChatMessage(targetUserId, message),
    sendTyping: (targetUserId, isTyping) => window.MessengerWS.sendTyping(targetUserId, isTyping),
    searchUsers: (query) => window.MessengerWS.searchUsers(query),
    getOnlineUsers: () => window.MessengerWS.getOnlineUsers(),
    isConnected: () => window.MessengerWS.isConnectionActive(),
    getUserInfo: () => window.MessengerWS.getUserInfo(),
    
    // Event handling
    on: (event, callback) => window.MessengerWS.on(event, callback),
    off: (event, callback) => window.MessengerWS.off(event, callback),
    once: (event, callback) => window.MessengerWS.once(event, callback)
};
