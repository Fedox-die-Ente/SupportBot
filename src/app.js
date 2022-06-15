const Discord = require('discord.js');
const { Intents, Constants } = require('discord.js');
const Bot = require('./core/bot');
const { loadConfig, loadMongoDB, loadEvents, loadCommands} = require('./helper/loader');

const toml = require('toml');
const fs = require("fs")
const readdir = require("util").promisify(fs.readdir)
const config = loadConfig()

const client = new Bot({
    intents: [
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
    partials: Object.values(Constants.PartialTypes),
    allowedMention: {
        parse: ["users"]
    },
    ws: {
        properties: {
            $browser: 'Discord iOS',
        }
    }
});

const init = async () => {
    loadMongoDB(client, config);
    loadEvents(client);
   // loadCommands(client);
    client.login(config.general.bot_token);
}
init()
    .then(() => {
        client.logger.log("Der Client wurde initialisiert. ", "success")
    })
    .catch(err => {
        client.logger.log("Es gab ein Fehler beim initialisieren.\n" + err, "error")
    })

module.exports.client = client;