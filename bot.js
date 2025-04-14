const TelegramBot = require('node-telegram-bot-api');

// Your bot token from BotFather
const token = '8042609922:AAHkCi3PPOoyH_2_Eob_aMYT7Jc2p6jcX9w';

// Create the bot and enable polling
const bot = new TelegramBot(token, { polling: true });

// Your personal Telegram user ID (the "admin" who receives forwarded messages)
const OWNER_ID = 7552691384;

// A test image URL
const img = "https://www.skyweaver.net/images/media/wallpapers/wallpaper1.jpg";

module.exports = bot;