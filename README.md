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

### Server Mode (Real-time messaging across networks)

**For real messaging between different users and networks:**

1. **Install Node.js** (v14 or higher)
2. **Clone and setup**:
```bash
git clone https://github.com/HappyDeathHD/MsgHD.git
cd MsgHD
npm install
```

3. **Start the server**:
```bash
npm start
```

4. **Access the application**:
   - Local: http://localhost:3000
   - Network: http://[YOUR_IP]:3000 (share with others)

### Client-only Mode (Local browser tabs)

**For testing or local use (works only between tabs in same browser):**

1. Clone the repository:
```bash
git clone https://github.com/HappyDeathHD/MsgHD.git
cd MsgHD
```

2. Open `index.html` directly in browser
   - **Double-click** `index.html`, or
   - **Use local server**:
     - **Live Server** (VS Code): Right-click `index.html` → "Open with Live Server"
     - **Python**: `python -m http.server 8000`
     - **Node.js**: `npx serve .`

### GitHub Pages (Static hosting)

**Live Demo**: https://HappyDeathHD.github.io/MsgHD

#### To enable GitHub Pages:
1. Go to repository Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Choose "main" branch and "/ (root)" folder
4. Click "Save"
5. Wait 5-10 minutes for deployment

**Note**: GitHub Pages version works in client-only mode (same browser tabs)

### Cloud Deployment (Recommended)

**For internet access from anywhere:**

#### Railway (Free & Easy):
1. Go to https://railway.app
2. Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your fork of MsgHD
5. Click "Deploy Now"
6. Get your public URL: `https://msghd-production.up.railway.app`

#### Render (Alternative):
1. Go to https://render.com
2. "New" → "Web Service" → Connect GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`

#### Docker (Any platform):
```bash
docker build -t msghd .
docker run -p 3000:3000 msghd
```

### Local Network Setup

**For local network access:**

1. **Find your IP**: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. **Open firewall port 3000** (if needed)
3. **Share URL**: `http://[YOUR_IP]:3000`

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
