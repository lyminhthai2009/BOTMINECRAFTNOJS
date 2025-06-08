const mineflayer = require('mineflayer');
const readline = require('readline');

let bots = [];
let prefix = '!';
let joinPaused = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Nhập IP, port, số lượng bot, và tên bot
rl.question('Nhập IP server: ', (ip) => {
  rl.question('Nhập port: ', (port) => {
    rl.question('Số lượng bot: ', (botCount) => {
      rl.question('Tên bot (ví dụ: BOT): ', (namePrefix) => {
        startBots(ip, parseInt(port), parseInt(botCount), namePrefix);
        rl.setPrompt('> ');
        rl.prompt();
      });
    });
  });
});

function startBots(ip, port, count, namePrefix) {
  let i = 0;
  const interval = setInterval(() => {
    if (joinPaused || i >= count) {
      clearInterval(interval);
      return;
    }
    createBot(ip, port, `${namePrefix}${i + 1}`);
    i++;
  }, 5000);
}

function createBot(ip, port, username) {
  const bot = mineflayer.createBot({
    host: ip,
    port: port,
    username: username,
    version: false
  });

  bot.on('login', () => {
    console.log(`\x1b[32m[+] ${bot.username} đã vào server!\x1b[0m`);
  });

  bot.on('end', () => {
    console.log(`\x1b[31m[-] ${bot.username} đã out khỏi server!\x1b[0m`);
  });

  bot.on('chat', (username, message) => {
    if (username !== bot.username) {
      console.log(`\x1b[33m[${username}]: ${message}\x1b[0m`);
    }
  });

  bot.on('error', (err) => {
    console.log(`\x1b[31m[!] ${bot.username} lỗi: ${err.message}\x1b[0m`);
  });

  bots.push(bot);
}

// Xử lý lệnh từ console
rl.on('line', (input) => {
  if (!input.startsWith(prefix)) {
    rl.prompt();
    return;
  }

  const args = input.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  switch (cmd) {
    case 'say':
      const message = args.join(' ');
      if (message) {
        bots.forEach(bot => bot.chat(message));
      } else {
        console.log('⚠️ Dùng: !say <tin nhắn>');
      }
      break;

    case 'spam':
      const times = parseInt(args[0]);
      const msg = args.slice(1).join(' ');
      if (isNaN(times) || !msg) {
        console.log('⚠️ Dùng: !spam <số lần> <tin nhắn>');
        break;
      }
      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          bots.forEach(bot => bot.chat(msg));
        }, i * 1000);
      }
      break;

    case 'jump':
      bots.forEach(bot => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
      });
      break;

    case 'a': case 's': case 'w': case 'd':
      const directionMap = {
        a: 'left',
        s: 'back',
        w: 'forward',
        d: 'right'
      };
      bots.forEach(bot => {
        bot.setControlState(directionMap[cmd], true);
        setTimeout(() => bot.setControlState(directionMap[cmd], false), 1000);
      });
      break;

    case 'knl':
      bots.forEach(bot => bot.quit());
      bots = [];
      rl.question('Tên bot (ví dụ: BOT): ', (namePrefix) => {
        rl.question('Số lượng bot: ', (botCount) => {
          startBots(bots[0]?.host ?? 'localhost', bots[0]?.port ?? 25565, parseInt(botCount), namePrefix);
        });
      });
      break;

    case 'sb':
      joinPaused = true;
      console.log('⏸️ Đã tạm dừng join bot.');
      break;

    case 'rcn':
      joinPaused = false;
      console.log('▶️ Đã tiếp tục join bot.');
      break;

    default:
      console.log('⚠️ Lệnh không hợp lệ!');
  }

  rl.prompt();
});
