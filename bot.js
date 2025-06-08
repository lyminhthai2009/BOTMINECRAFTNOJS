const mineflayer = require('mineflayer');
const readline = require('readline');

let botList = [];
let joiningPaused = false;
let namePrefixGlobal = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hỏi thông tin
rl.question('Nhập IP server (ví dụ: smp123.aternos.me): ', (ip) => {
  rl.question('Nhập PORT server (ví dụ: 25565): ', (port) => {
    rl.question('Nhập số lượng bot muốn chạy: ', (botCountInput) => {
      rl.question('Nhập prefix tên bot (VD: BOT): ', (namePrefix) => {
        const botCount = parseInt(botCountInput);
        namePrefixGlobal = namePrefix;
        startSpawningBots(ip, parseInt(port), botCount, namePrefix);
        rl.prompt();
      });
    });
  });
});

// Hàm tạo bot
function createBot(username, host, port, isLogger) {
  const bot = mineflayer.createBot({
    host: host,
    port: port,
    username: username
  });

  bot.on('login', () => {
    console.log(`[+] ${username} đã vào server`);
  });

  // Chỉ BOT1 log chat
  if (isLogger) {
    bot.on('chat', (username, message) => {
      if (username !== bot.username) {
        console.log(`<${username}> ${message}`);
      }
    });
  }

  // Các bot vẫn thực hiện lệnh
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    if (message.startsWith('!say ')) {
      const sayMsg = message.slice(5);
      botList.forEach(b => b.chat(sayMsg));
    }

    if (message.startsWith('!spam ')) {
      const [_, times, ...msg] = message.split(' ');
      const text = msg.join(' ');
      for (let i = 0; i < parseInt(times); i++) {
        setTimeout(() => {
          botList.forEach(b => b.chat(text));
        }, i * 500);
      }
    }

    if (message === '!sb') {
      joiningPaused = true;
      console.log('[!] Đã tạm dừng việc join bot.');
    }

    if (message === '!rcn') {
      joiningPaused = false;
      console.log('[!] Tiếp tục cho bot join.');
    }
  });

  bot.on('end', () => {
    console.log(`[!] ${username} đã rời khỏi server.`);
  });

  bot.on('error', err => {
    console.log(`[!] Lỗi với ${username}: ${err.code || err}`);
  });

  return bot;
}

// Tạo bot cách nhau 5 giây
async function startSpawningBots(host, port, total, namePrefix) {
  for (let i = 1; i <= total; i++) {
    while (joiningPaused) await delay(1000);
    const botName = `${namePrefix}${i}`;
    const isLogger = i === 1;
    const bot = createBot(botName, host, port, isLogger);
    botList.push(bot);
    await delay(5000);
  }
}

// Delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Nhận lệnh từ terminal
rl.on('line', (input) => {
  if (input.startsWith('!say ')) {
    const msg = input.slice(5);
    botList.forEach(bot => bot.chat(msg));
  }
  if (input === '!sb') {
    joiningPaused = true;
    console.log('[!] Tạm dừng join bot.');
  }
  if (input === '!rcn') {
    joiningPaused = false;
    console.log('[!] Tiếp tục join bot.');
  }
});
