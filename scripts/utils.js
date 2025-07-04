// Utility functions for MsgHD messenger

/**
 * Generate a random user ID
 * @param {number} length - Length of the ID
 * @returns {string} Random alphanumeric ID
 */
function generateUserId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate avatar initials from name
 * @param {string} name - User name
 * @returns {string} Initials (max 2 characters)
 */
function getInitials(name) {
    if (!name) return '?';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a random color for avatars
 * @param {string} seed - Seed for consistent colors
 * @returns {string} Hex color
 */
function getAvatarColor(seed) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
    ];
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Format timestamp for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'сейчас';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} мин назад`;
    }
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'вчера';
    }
    
    // This year
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }
    
    // Other years
    return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
    });
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Parse and linkify URLs in text
 * @param {string} text - Text to process
 * @returns {string} Text with clickable links
 */
function linkifyText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return sanitizeHtml(text).replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Validate nickname
 * @param {string} nickname - Nickname to validate
 * @returns {Object} Validation result
 */
function validateNickname(nickname) {
    const result = {
        valid: true,
        errors: []
    };
    
    if (!nickname || nickname.trim().length === 0) {
        result.valid = false;
        result.errors.push('Никнейм не может быть пустым');
        return result;
    }
    
    const trimmed = nickname.trim();
    
    if (trimmed.length < 2) {
        result.valid = false;
        result.errors.push('Никнейм должен содержать минимум 2 символа');
    }
    
    if (trimmed.length > 20) {
        result.valid = false;
        result.errors.push('Никнейм не может быть длиннее 20 символов');
    }
    
    if (!/^[a-zA-Zа-яёА-ЯЁ0-9_\-\s]+$/.test(trimmed)) {
        result.valid = false;
        result.errors.push('Никнейм может содержать только буквы, цифры, пробелы, дефисы и подчеркивания');
    }
    
    return result;
}

/**
 * Format message text with basic formatting
 * @param {string} text - Text to format
 * @returns {string} Formatted HTML
 */
function formatMessage(text) {
    let formatted = linkifyText(text);
    
    // Simple emoji support
    const emojiMap = {
        ':)': '😊',
        ':-)': '😊',
        ':(': '😞',
        ':-(': '😞',
        ':D': '😃',
        ':-D': '😃',
        ';)': '😉',
        ';-)': '😉',
        ':P': '😛',
        ':-P': '😛',
        ':o': '😮',
        ':-o': '😮',
        '<3': '❤️',
        '</3': '💔'
    };
    
    Object.keys(emojiMap).forEach(emoticon => {
        const regex = new RegExp(escapeRegExp(emoticon), 'g');
        formatted = formatted.replace(regex, emojiMap[emoticon]);
    });
    
    return formatted;
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    } catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

/**
 * Request notification permission
 * @returns {Promise<boolean>} Permission granted
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission === 'denied') {
        return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Show browser notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} icon - Notification icon URL
 */
function showBrowserNotification(title, body, icon = null) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    
    const notification = new Notification(title, {
        body: body,
        icon: icon || '/favicon.ico',
        badge: icon || '/favicon.ico',
        tag: 'msghd-message',
        renotify: false,
        silent: false
    });
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => {
        notification.close();
    }, 5000);
}

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Storage utility for managing temporary data
 */
const Storage = {
    data: new Map(),
    
    set(key, value) {
        this.data.set(key, value);
    },
    
    get(key) {
        return this.data.get(key);
    },
    
    has(key) {
        return this.data.has(key);
    },
    
    delete(key) {
        return this.data.delete(key);
    },
    
    clear() {
        this.data.clear();
    },
    
    keys() {
        return Array.from(this.data.keys());
    },
    
    values() {
        return Array.from(this.data.values());
    }
};

/**
 * Event emitter for custom events
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }
    
    emit(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in event callback:', error);
            }
        });
    }
    
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
}

// Export utility object for use in other scripts
window.Utils = {
    generateUserId,
    getInitials,
    getAvatarColor,
    formatTime,
    sanitizeHtml,
    linkifyText,
    showNotification,
    debounce,
    throttle,
    validateNickname,
    formatMessage,
    escapeRegExp,
    isMobile,
    copyToClipboard,
    playNotificationSound,
    requestNotificationPermission,
    showBrowserNotification,
    generateUUID,
    Storage,
    EventEmitter
};
