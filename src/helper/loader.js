const toml = require('toml');
const fs = require("fs")
const readdir = require("util").promisify(fs.readdir)
const readdirSync = require("util").promisify(fs.readdirSync);
const mongoose = require("mongoose");
const chalk = require("chalk");
const Discord = require("discord.js");
const path = require("path");
function loadConfig() {
    let config;
    if (fs.existsSync('./config.toml')) {
        config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'))
    } else {
        require("./logger")
            .log("Es wurde keine Config Datei gefunden.", "error")
    }
    return config;
}

function loadMongoDB(client, config) {
    mongoose.connect(config.general.mongodb, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    require("./logger")
        .log("Die Verbindung mit MongoDB wurde erfolgreich hergestellt.", "success")
}

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, "..", "events");
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.run(client, ...args));
        } else {
            client.on(event.name, (...args) => event.run(client, ...args));
        }
    }
}

async function loadCommands(client){
    const directories = await readdir("./src/commands/");
    for (let directory of directories) {
        const commands = await readdir('./src/commands/' + directory + '/');
        commands.forEach((cmd) => {
            if (cmd.split('.')[1] === 'js') {
                let response = client.loadCommand('../commands/' + directory, cmd);
                if (response) client.logger.log(response, 'error');
            }
        });
    }
}

module.exports = {
    loadConfig,
    loadMongoDB,
    loadEvents,
    loadCommands
}