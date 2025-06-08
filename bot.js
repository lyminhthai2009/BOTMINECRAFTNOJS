const mineflayer = require('mineflayer');
const readline = require('readline');

const botCount = 50;
const host = 'smp114555-y1xo.aternos.me';
const port = 32672;
const version = '1.21.1';
const prefix = '!';

const bots = [];
let paused = false;
let botIndex = 0;

// Khởi tạo bot
function createBot(index) {
  if (index >= botCount || paused) return;

  const bot = mineflayer.createBot({
    host,
    port,
    version,
    username: `Bot${index + 1}`,
    auth: 'offline',
  });

  bot.ready = false;

  bot.once('spawn', () => {
    bot.ready = true;
    console.log(`${bot.username} đã vào game.`);
  });

  bot.on('chat', (username, message) => {
    if (!bot.ready || username === bot.username || !message.startsWith(prefix)) return;
    handleCommand(message);
  });

  bot.on('kicked', reason => console.log(`${bot.username} bị kick: ${reason}`));
  bot.on('error', err => console.log(`${bot.username} lỗi:`, err));

  bots.push(bot);
  botIndex++;

  // Tạo bot tiếp theo sau 5s
  if (!paused && botIndex < botCount) {
    setTimeout(() => createBot(botIndex), 5000);
  }
}

// Xử lý lệnh
function handleCommand(message) {
  if (!message.startsWith(prefix)) return;
  const args = message.slice(prefix.length).trim().split(' ');
  const cmd = args.shift();
  const activeBots = bots.filter(b => b.ready);

  switch (cmd) {
    case 'say': {
      const text = args.join(' ');
      activeBots.forEach(b => b.chat(text));
      break;
    }

    case 'jump':
      activeBots.forEach(b => {
        b.setControlState('jump', true);
        setTimeout(() => b.setControlState('jump', false), 500);
      });
      break;

    case 'move':
      const dir = args[0];
      activeBots.forEach(b => {
        b.clearControlStates();
        if (['forward', 'back', 'left', 'right'].includes(dir)) {
          b.setControlState(dir, true);
        }
      });
      break;

    case 'stop':
      activeBots.forEach(b => b.clearControlStates());
      break;

    case 'spam': {
      const times = parseInt(args[0]);
      const msg = args.slice(1).join(' ');
      if (!times || !msg) return console.log('Cú pháp: !spam [số lần] [tin nhắn]');
      activeBots.forEach((b, index) => {
        for (let i = 0; i < times; i++) {
          setTimeout(() => b.chat(msg), i * 500 + index * 100);
        }
      });
      break;
    }

    case 'sb': {
      paused = true;
      console.log('⏸️ Tạm dừng tạo bot mới.');
      break;
    }

    case 'rcn': {
      if (paused) {
        paused = false;
        console.log('▶️ Tiếp tục tạo bot...');
        createBot(botIndex);
      } else {
        console.log('⚠️ Bot đã chạy liên tục rồi.');
      }
      break;
    }

    default:
      console.log(`❓ Không rõ lệnh: ${cmd}`);
  }
}

// Giao diện dòng lệnh
function startConsoleInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', (line) => {
    if (line.trim()) handleCommand(line.trim());
    rl.prompt();
  }).on('close', () => {
    console.log('Thoát lệnh console.');
    process.exit(0);
  });
}

// Bắt đầu
createBot(botIndex);
startConsoleInput();
