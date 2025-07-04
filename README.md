# MsgHD - Advanced Messaging Application

![MsgHD Logo](https://via.placeholder.com/100x100/0088cc/ffffff?text=MsgHD)

Advanced messaging application with high-definition communication features. A modern minimalist messenger inspired by Telegram, working without a database with temporary data storage only on the client side.

## 🚀 Demo

**[Visit MsgHD →](https://HappyDeathHD.github.io/MsgHD)**

## ✨ Features

- 💬 **Instant messaging** - Real-time message exchange
- 🔍 **User search** - Find interlocutors by username or ID
- 🎨 **4 themes** - Light, dark, Telegram and Telegram Dark
- 📱 **Responsive design** - Works on all devices
- 🔔 **Notifications** - Audio and browser notifications
- 👥 **Online status** - See who's online
- ⚡ **No registration** - Just enter a username and start chatting
- 🚫 **Temporary data** - All data is deleted when the page is closed

## 🛠️ Technologies

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Communication**: BroadcastChannel API (with localStorage fallback)
- **Design**: CSS Grid/Flexbox, CSS Variables
- **Deploy**: GitHub Pages

## 🎯 How to use

1. Open the application in your browser
2. Enter your username (2-20 characters)
3. Get an automatically generated ID
4. Find another user through search
5. Start chatting!

### Functions:

- **Search**: Enter username or ID in the search field
- **Chat**: Click on a user to start a dialogue
- **Themes**: 🌙 button to switch themes
- **Status**: Typing indicator and online status
- **Notifications**: Sounds and browser notifications

## 📁 Project structure

```
MsgHD/
├── index.html              # Main page
├── styles/
│   ├── main.css            # Main styles
│   └── themes.css          # Themes
├── scripts/
│   ├── app.js              # Main application logic
│   ├── websocket.js        # Communication between users
│   └── utils.js            # Utility functions
├── requirements.md         # Technical specifications
└── README.md              # Documentation
```

## 🔧 Installation and launch

### Local development

1. Clone the repository:
```bash
git clone https://github.com/HappyDeathHD/MsgHD.git
cd MsgHD
```

2. Start local server:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# Live Server (VS Code)
# Install Live Server extension and click "Go Live"
```

3. Open http://localhost:8000 in your browser

### Deploy to GitHub Pages

1. Fork the repository
2. Go to Settings → Pages
3. Select Source: Deploy from a branch
4. Select main branch and / (root) folder
5. Save settings

Your messenger will be available at: `https://HappyDeathHD.github.io/MsgHD`

## 🎨 Themes

The application supports 4 themes:

1. **Light** 🌙 - Classic light interface
2. **Dark** ☀️ - Dark theme for eye comfort
3. **Telegram** 🎨 - In the style of original Telegram
4. **Telegram Dark** 💫 - Dark version of Telegram

## 🔐 Privacy and security

- **No servers**: All data is stored locally
- **Temporary**: Data is deleted when the page is closed
- **P2P communication**: Messages are transmitted directly between browsers
- **No registration**: No personal information required

## 📱 Supported browsers

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🤝 Contributing

1. Fork the project
2. Create a branch for the new feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 TODO

- [ ] Image sending
- [ ] Group chats
- [ ] Save history to localStorage (optional)
- [ ] More emojis and stickers
- [ ] Voice messages
- [ ] Notification settings
- [ ] Chat export

## 🐛 Known limitations

- Works only within the same domain
- Messages are not saved between sessions
- Maximum users limited by browser performance
- Requires open tabs to work

## 📄 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

## 👨‍💻 Author

**HappyDeathHD**
- GitHub: [@HappyDeathHD](https://github.com/HappyDeathHD)
- Email: hdkelik@gmail.com

## 🙏 Acknowledgments

- Telegram for design inspiration
- Mozilla for Web APIs documentation
- GitHub for free hosting

---

**⚠️ Important**: This project is created to demonstrate web technology capabilities and is not intended for production use with confidential data.
