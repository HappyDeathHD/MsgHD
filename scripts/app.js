// Main application logic for MsgHD messenger

class MsgHDApp {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.chats = new Map();
        this.searchResults = new Map();
        this.typingTimeouts = new Map();
        this.theme = 'light';
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.bindEvents();
        this.loadTheme();
        this.checkMobileView();
        this.requestNotificationPermission();
        
        console.log('MsgHD App initialized');
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Login form events
        const nicknameInput = document.getElementById('nickname-input');
        const joinBtn = document.getElementById('join-btn');
        
        nicknameInput.addEventListener('input', this.handleNicknameInput.bind(this));
        nicknameInput.addEventListener('keypress', this.handleNicknameKeyPress.bind(this));
        joinBtn.addEventListener('click', this.handleJoin.bind(this));

        // Messenger events
        const searchInput = document.getElementById('search-input');
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const closeChatBtn = document.getElementById('close-chat-btn');
        const themeToggle = document.getElementById('theme-toggle');
        const logoutBtn = document.getElementById('logout-btn');

        searchInput.addEventListener('input', Utils.debounce(this.handleSearch.bind(this), 300));
        messageInput.addEventListener('input', this.handleMessageInput.bind(this));
        messageInput.addEventListener('keypress', this.handleMessageKeyPress.bind(this));
        sendBtn.addEventListener('click', this.handleSendMessage.bind(this));
        closeChatBtn.addEventListener('click', this.handleCloseChat.bind(this));
        themeToggle.addEventListener('click', this.handleThemeToggle.bind(this));
        logoutBtn.addEventListener('click', this.handleLogout.bind(this));

        // Modal events
        const closeModalBtn = document.getElementById('close-modal-btn');
        const startChatBtn = document.getElementById('start-chat-btn');
        const modal = document.getElementById('user-info-modal');

        closeModalBtn.addEventListener('click', this.closeModal.bind(this));
        startChatBtn.addEventListener('click', this.handleStartChat.bind(this));
        modal.addEventListener('click', this.handleModalClick.bind(this));

        // WebSocket events
        WebSocketManager.on('connected', this.handleConnected.bind(this));
        WebSocketManager.on('disconnected', this.handleDisconnected.bind(this));
        WebSocketManager.on('user_joined', this.handleUserJoined.bind(this));
        WebSocketManager.on('user_left', this.handleUserLeft.bind(this));
        WebSocketManager.on('chat_message', this.handleChatMessage.bind(this));
        WebSocketManager.on('typing_start', this.handleTypingStart.bind(this));
        WebSocketManager.on('typing_stop', this.handleTypingStop.bind(this));
        WebSocketManager.on('search_result', this.handleSearchResult.bind(this));
        WebSocketManager.on('online_users_updated', this.handleOnlineUsersUpdated.bind(this));

        // Window events
        window.addEventListener('resize', Utils.throttle(this.checkMobileView.bind(this), 200));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    /**
     * Handle nickname input
     */
    handleNicknameInput(event) {
        const nickname = event.target.value.trim();
        const joinBtn = document.getElementById('join-btn');
        const validation = Utils.validateNickname(nickname);
        
        joinBtn.disabled = !validation.valid;
        
        if (nickname.length > 0 && !validation.valid) {
            Utils.showNotification(validation.errors[0], 'error', 2000);
        }
    }

    /**
     * Handle nickname keypress
     */
    handleNicknameKeyPress(event) {
        if (event.key === 'Enter') {
            const joinBtn = document.getElementById('join-btn');
            if (!joinBtn.disabled) {
                this.handleJoin();
            }
        }
    }

    /**
     * Handle join button click
     */
    async handleJoin() {
        const nicknameInput = document.getElementById('nickname-input');
        const nickname = nicknameInput.value.trim();
        
        const validation = Utils.validateNickname(nickname);
        if (!validation.valid) {
            Utils.showNotification(validation.errors[0], 'error');
            return;
        }

        try {
            // Generate user ID
            const userId = Utils.generateUserId();
            
            // Create user object
            this.currentUser = {
                nickname: nickname,
                userId: userId,
                avatar: Utils.getInitials(nickname),
                color: Utils.getAvatarColor(nickname)
            };

            // Connect to WebSocket
            WebSocketManager.connect(nickname, userId);
            
            // Update UI
            this.updateUserInfo();
            this.switchToMessengerScreen();
            
            Utils.showNotification(`Добро пожаловать, ${nickname}!`, 'success');
            
        } catch (error) {
            console.error('Join error:', error);
            Utils.showNotification('Ошибка при подключении', 'error');
        }
    }

    /**
     * Update user info in the UI
     */
    updateUserInfo() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userId = document.getElementById('user-id');

        userAvatar.textContent = this.currentUser.avatar;
        userAvatar.style.background = this.currentUser.color;
        userName.textContent = this.currentUser.nickname;
        userId.textContent = `ID: ${this.currentUser.userId}`;
    }

    /**
     * Switch to messenger screen
     */
    switchToMessengerScreen() {
        const loginScreen = document.getElementById('login-screen');
        const messengerScreen = document.getElementById('messenger-screen');
        
        loginScreen.classList.remove('active');
        messengerScreen.classList.add('active');
    }

    /**
     * Switch to login screen
     */
    switchToLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const messengerScreen = document.getElementById('messenger-screen');
        
        messengerScreen.classList.remove('active');
        loginScreen.classList.add('active');
        
        // Clear nickname input
        document.getElementById('nickname-input').value = '';
        document.getElementById('join-btn').disabled = true;
    }

    /**
     * Handle search input
     */
    handleSearch(event) {
        const query = event.target.value.trim();
        const searchResults = document.getElementById('search-results');
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            this.searchResults.clear();
            return;
        }

        // Clear previous results
        searchResults.innerHTML = '<div style="padding: 10px; color: var(--text-secondary);">Поиск...</div>';
        this.searchResults.clear();

        // Search through online users
        const onlineUsers = WebSocketManager.getOnlineUsers();
        const localResults = onlineUsers.filter(user => 
            user.nickname.toLowerCase().includes(query.toLowerCase()) ||
            user.userId.toLowerCase().includes(query.toLowerCase())
        );

        localResults.forEach(user => {
            this.addSearchResult(user, query);
        });

        // Also search via WebSocket
        WebSocketManager.searchUsers(query);

        // Show "no results" if nothing found
        setTimeout(() => {
            if (this.searchResults.size === 0) {
                searchResults.innerHTML = '<div style="padding: 10px; color: var(--text-secondary);">Пользователи не найдены</div>';
            }
        }, 1000);
    }

    /**
     * Add search result to UI
     */
    addSearchResult(user, query) {
        if (this.searchResults.has(user.userId)) return;
        
        this.searchResults.set(user.userId, user);
        
        const searchResults = document.getElementById('search-results');
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.onclick = () => this.showUserInfo(user);
        
        resultDiv.innerHTML = `
            <div class="search-result-avatar" style="background: ${Utils.getAvatarColor(user.nickname)}">
                ${Utils.getInitials(user.nickname)}
            </div>
            <div class="search-result-info">
                <div class="search-result-name">${Utils.sanitizeHtml(user.nickname)}</div>
                <div class="search-result-id">ID: ${user.userId}</div>
            </div>
        `;
        
        if (searchResults.firstChild && searchResults.firstChild.textContent.includes('Поиск')) {
            searchResults.innerHTML = '';
        }
        
        searchResults.appendChild(resultDiv);
    }

    /**
     * Show user info modal
     */
    showUserInfo(user) {
        const modal = document.getElementById('user-info-modal');
        const avatar = document.getElementById('modal-user-avatar');
        const name = document.getElementById('modal-user-name');
        const userId = document.getElementById('modal-user-id');
        const status = document.getElementById('modal-user-status');
        const startChatBtn = document.getElementById('start-chat-btn');

        avatar.textContent = Utils.getInitials(user.nickname);
        avatar.style.background = Utils.getAvatarColor(user.nickname);
        name.textContent = user.nickname;
        userId.textContent = `ID: ${user.userId}`;
        status.textContent = user.status || 'онлайн';
        
        startChatBtn.onclick = () => this.startChat(user);
        
        modal.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('user-info-modal');
        modal.classList.remove('active');
    }

    /**
     * Handle modal click (close on backdrop click)
     */
    handleModalClick(event) {
        if (event.target.id === 'user-info-modal') {
            this.closeModal();
        }
    }

    /**
     * Start chat with user
     */
    startChat(user) {
        this.currentChat = user;
        this.closeModal();
        this.openChat(user);
        
        // Clear search
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
        this.searchResults.clear();
    }

    /**
     * Handle start chat button
     */
    handleStartChat() {
        const modal = document.getElementById('user-info-modal');
        const startChatBtn = document.getElementById('start-chat-btn');
        
        if (startChatBtn.onclick) {
            startChatBtn.onclick();
        }
    }

    /**
     * Open chat with user
     */
    openChat(user) {
        this.currentChat = user;
        
        const chatPlaceholder = document.getElementById('chat-placeholder');
        const chatContainer = document.getElementById('chat-container');
        const chatUserAvatar = document.getElementById('chat-user-avatar');
        const chatUserName = document.getElementById('chat-user-name');
        const chatUserStatus = document.getElementById('chat-user-status');
        
        chatPlaceholder.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        chatUserAvatar.textContent = Utils.getInitials(user.nickname);
        chatUserAvatar.style.background = Utils.getAvatarColor(user.nickname);
        chatUserName.textContent = user.nickname;
        chatUserStatus.textContent = user.status || 'онлайн';
        
        // Initialize chat if not exists
        if (!this.chats.has(user.userId)) {
            this.chats.set(user.userId, {
                user: user,
                messages: [],
                unreadCount: 0
            });
        }
        
        this.loadChatMessages(user.userId);
        this.updateChatsList();
        this.enableMessageInput();
        
        // Mark messages as read
        const chat = this.chats.get(user.userId);
        chat.unreadCount = 0;
        this.updateChatItem(user.userId);
    }

    /**
     * Close current chat
     */
    handleCloseChat() {
        this.currentChat = null;
        
        const chatPlaceholder = document.getElementById('chat-placeholder');
        const chatContainer = document.getElementById('chat-container');
        
        chatContainer.style.display = 'none';
        chatPlaceholder.style.display = 'flex';
        
        this.disableMessageInput();
        this.updateChatsList();
    }

    /**
     * Enable message input
     */
    enableMessageInput() {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        
        messageInput.disabled = false;
        messageInput.placeholder = 'Введите сообщение...';
        sendBtn.disabled = false;
        
        messageInput.focus();
    }

    /**
     * Disable message input
     */
    disableMessageInput() {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        
        messageInput.disabled = true;
        messageInput.placeholder = 'Выберите чат для отправки сообщений';
        messageInput.value = '';
        sendBtn.disabled = true;
    }

    /**
     * Handle message input
     */
    handleMessageInput(event) {
        const message = event.target.value.trim();
        const sendBtn = document.getElementById('send-btn');
        
        sendBtn.disabled = message.length === 0;
        
        // Send typing indicator
        if (this.currentChat && message.length > 0) {
            WebSocketManager.sendTyping(this.currentChat.userId, true);
            
            // Clear previous timeout
            if (this.typingTimeouts.has('self')) {
                clearTimeout(this.typingTimeouts.get('self'));
            }
            
            // Set timeout to stop typing
            const timeout = setTimeout(() => {
                WebSocketManager.sendTyping(this.currentChat.userId, false);
                this.typingTimeouts.delete('self');
            }, 2000);
            
            this.typingTimeouts.set('self', timeout);
        }
    }

    /**
     * Handle message keypress
     */
    handleMessageKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSendMessage();
        }
    }

    /**
     * Handle send message
     */
    handleSendMessage() {
        if (!this.currentChat) return;
        
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message.length === 0) return;
        
        try {
            // Send message via WebSocket
            WebSocketManager.sendChatMessage(this.currentChat.userId, message);
            
            // Add to local chat
            this.addMessageToChat(this.currentChat.userId, {
                id: Utils.generateUUID(),
                text: message,
                timestamp: Date.now(),
                fromUserId: this.currentUser.userId,
                fromNickname: this.currentUser.nickname,
                type: 'outgoing'
            });
            
            // Clear input
            messageInput.value = '';
            document.getElementById('send-btn').disabled = true;
            
            // Stop typing
            WebSocketManager.sendTyping(this.currentChat.userId, false);
            if (this.typingTimeouts.has('self')) {
                clearTimeout(this.typingTimeouts.get('self'));
                this.typingTimeouts.delete('self');
            }
            
            // Play send sound
            Utils.playNotificationSound();
            
        } catch (error) {
            console.error('Send message error:', error);
            Utils.showNotification('Ошибка отправки сообщения', 'error');
        }
    }

    /**
     * Add message to chat
     */
    addMessageToChat(userId, message) {
        if (!this.chats.has(userId)) {
            // Find user info
            const onlineUsers = WebSocketManager.getOnlineUsers();
            const user = onlineUsers.find(u => u.userId === userId) || {
                userId: userId,
                nickname: message.fromNickname || 'Unknown User',
                status: 'online'
            };
            
            this.chats.set(userId, {
                user: user,
                messages: [],
                unreadCount: 0
            });
        }
        
        const chat = this.chats.get(userId);
        chat.messages.push(message);
        
        // Update unread count if not current chat
        if (!this.currentChat || this.currentChat.userId !== userId) {
            if (message.type === 'incoming') {
                chat.unreadCount++;
            }
        }
        
        // Update UI if this is the current chat
        if (this.currentChat && this.currentChat.userId === userId) {
            this.loadChatMessages(userId);
        }
        
        this.updateChatItem(userId);
        this.updateChatsList();
    }

    /**
     * Load chat messages
     */
    loadChatMessages(userId) {
        const chatMessages = document.getElementById('chat-messages');
        const chat = this.chats.get(userId);
        
        if (!chat) return;
        
        chatMessages.innerHTML = '';
        
        chat.messages.forEach(message => {
            this.renderMessage(message);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Render message in chat
     */
    renderMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        const isOwnMessage = message.fromUserId === this.currentUser.userId;
        messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'} fade-in`;
        
        const formattedText = Utils.formatMessage(message.text);
        const timeString = Utils.formatTime(new Date(message.timestamp));
        
        messageDiv.innerHTML = `
            <div class="message-text">${formattedText}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 10);
    }

    /**
     * Update chats list
     */
    updateChatsList() {
        const chatsList = document.getElementById('chats-list');
        const chatsArray = Array.from(this.chats.values()).sort((a, b) => {
            const aLastMessage = a.messages[a.messages.length - 1];
            const bLastMessage = b.messages[b.messages.length - 1];
            
            if (!aLastMessage && !bLastMessage) return 0;
            if (!aLastMessage) return 1;
            if (!bLastMessage) return -1;
            
            return bLastMessage.timestamp - aLastMessage.timestamp;
        });
        
        chatsList.innerHTML = '';
        
        if (chatsArray.length === 0) {
            chatsList.innerHTML = '<div class="no-chats">Нет активных чатов</div>';
            return;
        }
        
        chatsArray.forEach(chat => {
            this.renderChatItem(chat);
        });
    }

    /**
     * Render chat item
     */
    renderChatItem(chat) {
        const chatsList = document.getElementById('chats-list');
        const chatDiv = document.createElement('div');
        
        const isActive = this.currentChat && this.currentChat.userId === chat.user.userId;
        chatDiv.className = `chat-item ${isActive ? 'active' : ''}`;
        chatDiv.onclick = () => this.openChat(chat.user);
        
        const lastMessage = chat.messages[chat.messages.length - 1];
        const lastMessageText = lastMessage ? 
            (lastMessage.text.length > 30 ? lastMessage.text.substring(0, 30) + '...' : lastMessage.text) : 
            'Нет сообщений';
        const lastMessageTime = lastMessage ? Utils.formatTime(new Date(lastMessage.timestamp)) : '';
        
        chatDiv.innerHTML = `
            <div class="chat-item-avatar" style="background: ${Utils.getAvatarColor(chat.user.nickname)}">
                ${Utils.getInitials(chat.user.nickname)}
            </div>
            <div class="chat-item-info">
                <div class="chat-item-name">${Utils.sanitizeHtml(chat.user.nickname)}</div>
                <div class="chat-item-last-message">${Utils.sanitizeHtml(lastMessageText)}</div>
            </div>
            <div class="chat-item-time">${lastMessageTime}</div>
            ${chat.unreadCount > 0 ? `<div class="chat-item-unread">${chat.unreadCount}</div>` : ''}
        `;
        
        chatsList.appendChild(chatDiv);
    }

    /**
     * Update specific chat item
     */
    updateChatItem(userId) {
        // Re-render the entire list for simplicity
        this.updateChatsList();
    }

    /**
     * Update online users list
     */
    updateOnlineUsersList(users) {
        const onlineList = document.getElementById('online-users-list');
        
        onlineList.innerHTML = '';
        
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'online-user';
            userDiv.onclick = () => this.showUserInfo(user);
            
            userDiv.innerHTML = `
                <div class="online-user-avatar" style="background: ${Utils.getAvatarColor(user.nickname)}">
                    ${Utils.getInitials(user.nickname)}
                </div>
                <div class="online-user-name">${Utils.sanitizeHtml(user.nickname)}</div>
                <div class="online-status"></div>
            `;
            
            onlineList.appendChild(userDiv);
        });
        
        if (users.length === 0) {
            onlineList.innerHTML = '<div style="padding: 10px; color: var(--text-secondary); text-align: center;">Нет пользователей онлайн</div>';
        }
    }

    /**
     * Handle theme toggle
     */
    handleThemeToggle() {
        const themes = ['light', 'dark', 'telegram', 'telegram-dark'];
        const currentIndex = themes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcons = {
            'light': '🌙',
            'dark': '☀️',
            'telegram': '🎨',
            'telegram-dark': '💫'
        };
        
        themeToggle.textContent = themeIcons[theme] || '🌙';
        
        // Save theme preference
        Utils.Storage.set('theme', theme);
        
        Utils.showNotification(`Тема изменена на ${this.getThemeName(theme)}`, 'info', 2000);
    }

    /**
     * Get theme name
     */
    getThemeName(theme) {
        const names = {
            'light': 'Светлая',
            'dark': 'Тёмная',
            'telegram': 'Telegram',
            'telegram-dark': 'Telegram Dark'
        };
        return names[theme] || theme;
    }

    /**
     * Load saved theme
     */
    loadTheme() {
        const savedTheme = Utils.Storage.get('theme') || 'light';
        this.setTheme(savedTheme);
    }

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Вы уверены, что хотите выйти? Все данные будут потеряны.')) {
            this.logout();
        }
    }

    /**
     * Logout user
     */
    logout() {
        // Disconnect from WebSocket
        WebSocketManager.disconnect();
        
        // Clear user data
        this.currentUser = null;
        this.currentChat = null;
        this.chats.clear();
        this.searchResults.clear();
        this.typingTimeouts.clear();
        
        // Clear storage
        Utils.Storage.clear();
        
        // Switch to login screen
        this.switchToLoginScreen();
        
        Utils.showNotification('Вы вышли из мессенджера', 'info');
    }

    /**
     * Check mobile view
     */
    checkMobileView() {
        const sidebar = document.querySelector('.sidebar');
        
        if (Utils.isMobile()) {
            sidebar.classList.remove('active');
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        const hasPermission = await Utils.requestNotificationPermission();
        if (hasPermission) {
            console.log('Notification permission granted');
        }
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        if (WebSocketManager.isConnected()) {
            WebSocketManager.disconnect();
        }
    }

    // WebSocket event handlers

    /**
     * Handle WebSocket connected
     */
    handleConnected() {
        console.log('Connected to messenger network');
        Utils.showNotification('Подключено к сети', 'success', 2000);
    }

    /**
     * Handle WebSocket disconnected
     */
    handleDisconnected() {
        console.log('Disconnected from messenger network');
    }

    /**
     * Handle user joined
     */
    handleUserJoined(data) {
        console.log('User joined:', data.nickname);
        Utils.showNotification(`${data.nickname} подключился`, 'info', 2000);
        
        // Update online users
        const users = WebSocketManager.getOnlineUsers();
        this.updateOnlineUsersList(users);
    }

    /**
     * Handle user left
     */
    handleUserLeft(data) {
        console.log('User left:', data.nickname);
        Utils.showNotification(`${data.nickname} отключился`, 'info', 2000);
        
        // Update online users
        const users = WebSocketManager.getOnlineUsers();
        this.updateOnlineUsersList(users);
    }

    /**
     * Handle chat message
     */
    handleChatMessage(data) {
        // Only handle messages directed to us
        if (data.targetUserId !== this.currentUser.userId) return;
        
        console.log('Chat message received:', data);
        
        this.addMessageToChat(data.fromUserId, {
            id: data.id,
            text: data.message,
            timestamp: data.timestamp,
            fromUserId: data.fromUserId,
            fromNickname: data.fromNickname,
            type: 'incoming'
        });
        
        // Play notification sound
        Utils.playNotificationSound();
        
        // Show browser notification if not focused
        if (document.hidden) {
            Utils.showBrowserNotification(
                `Новое сообщение от ${data.fromNickname}`,
                data.message.length > 50 ? data.message.substring(0, 50) + '...' : data.message
            );
        }
        
        Utils.showNotification(`Сообщение от ${data.fromNickname}`, 'info', 3000);
    }

    /**
     * Handle typing start
     */
    handleTypingStart(data) {
        if (data.targetUserId !== this.currentUser.userId) return;
        if (!this.currentChat || this.currentChat.userId !== data.fromUserId) return;
        
        this.showTypingIndicator(data.fromUserId);
    }

    /**
     * Handle typing stop
     */
    handleTypingStop(data) {
        if (data.targetUserId !== this.currentUser.userId) return;
        
        this.hideTypingIndicator(data.fromUserId);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator(userId) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Remove existing typing indicator
        this.hideTypingIndicator(userId);
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator fade-in';
        typingDiv.id = `typing-${userId}`;
        
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideTypingIndicator(userId);
        }, 5000);
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator(userId) {
        const typingIndicator = document.getElementById(`typing-${userId}`);
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Handle search result
     */
    handleSearchResult(data) {
        this.addSearchResult(data.user, data.query);
    }

    /**
     * Handle online users updated
     */
    handleOnlineUsersUpdated(users) {
        this.updateOnlineUsersList(users);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MsgHDApp();
});

// Export for debugging
window.MsgHDApp = MsgHDApp;
