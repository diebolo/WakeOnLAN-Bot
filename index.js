const config = require("./config.json");
const discord = require("discord.js");
const client = new discord.Client();
const child_process = require("child_process");

// Function to log in to the Discord bot
function loginBot() {
  client.login(config.token)
    .then(() => {
      console.log(`Logged in as ${client.user.tag} on ${Date()}!`);
    })
    .catch((error) => {
      console.error("Error logging in:", error);
      // If login fails, try again after 10 seconds
      setTimeout(loginBot, 10000);
    });
}


// Online status
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag} on ${Date()}!`);
});

// Wake command
client.on("message", (msg) => {
  if (msg.author.id === config.ownerID && msg.content === "wake") {
    child_process.exec(
      "wakeonlan " + config.macAddress,
      (err, stdout) => {
        if (err) {
          msg.channel.send(err + "null");
        } else {
          msg.channel.send("woken ✅");
        }
      }
    );
  }
});

// Ping and uptime command
client.on("message", (message) => {
  if (message.content === "ping") {
    const latency = Date.now() - message.createdTimestamp;
    message.channel.send(
      `🏓 Latency is \`${latency}ms\`. \nAPI Latency is \`${Math.round(
        client.ws.ping
      )}ms\`.`
    );
  } else if (message.content === "uptime") {
    const hours = Math.round(client.uptime / 1000 / 3600);
    message.channel.send(`Uptime is \`${hours}\` hours.`);
  } else if (message.author.id === config.ownerID) {
    if (message.content.startsWith("eval ")) {
      evaluate(message);
    } else if (message.content.startsWith("exec ")) {
      execute(message);
    } else if (message.content === "status") {
      Status(message);
    }
  }
});

// Evaluate command
function evaluate(message) {
  const code = message.content.slice("eval ".length);
  try {
    let evaled = eval(code);
    if (typeof evaled !== "string") {
      evaled = require("util").inspect(evaled);
    }
    message.channel.send(`\`\`\`\n${cleanText(evaled)}\`\`\``);
  } catch (err) {
    message.channel.send(`\`ERROR\` \`\`\`\n${cleanText(err)}\n\`\`\``);
  }
}

// Execute command
function execute(message) {
  const command = message.content.slice("exec ".length);
  child_process.exec(command, (err, stdout, stderr) => {
    if (err) {
      message.channel.send(err);
    } else {
      message.channel.send("```" + stdout + stderr + "```");
    }
  });
}

// Status command
function Status(message) {
  child_process.exec("ping " + config.ipAddress + " -c 1", (err, stdout) => {
    if (err) {
      message.channel.send(err + "null");
    } else {
      const response = stdout.trim();
      if (response) {
        message.channel.send(response);
      } else {
        message.channel.send("No response. PC is offline.");
      }
    }
  });
}


// Clean text for discord markdown
function cleanText(text) {
  if (typeof text === "string") {
    return text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203));
  }
  return text;
}

loginBot();
