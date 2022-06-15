const {Permissions} = require("discord.js");
module.exports = {
    name: "ready",
    once: true,
    run: async (client) => {
        this.client = client;
        client.logger.log("Der Bot wurde erfolgreich gestartet.", "ready");

        client.user.setActivity( {name: "In Entwicklung", type: "STREAMING", url: "https://www.youtube.com/watch?v=xvFZjo5PgG0"} );

        client.invite = client.generateInvite({
            permissions: [
                Permissions.FLAGS.VIEW_AUDIT_LOG, Permissions.FLAGS.MANAGE_ROLES,
                Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.KICK_MEMBERS,
                Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS,
                Permissions.FLAGS.MANAGE_WEBHOOKS, Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES,
                Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.READ_MESSAGE_HISTORY, Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
                Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.SPEAK,
                Permissions.FLAGS.CONNECT
            ],
            scopes: [
                'bot',
                'applications.commands'
            ]
        });
    }
}