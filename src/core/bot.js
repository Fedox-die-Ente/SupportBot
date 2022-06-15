const Discord = require('discord.js');
const toml = require('toml');
const fs = require("fs")
const readdir = require("util").promisify(fs.readdir)

class Bot extends Discord.Client{
    constructor(options) {
        super(options);

        this.config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'))

        this.logger = require("../helper/logger");

        this.embedColor = this.config.embeds.color;
        this.embedFooter = this.config.embeds.footer;
        this.embedInvite = this.config.embeds.invite;
        this.embedWebsite = this.config.embeds.website;

        this.commands = new Discord.Collection();
        this.aliases = new Discord.Collection();

        this.databaseCache = {};
        this.databaseCache.users = new Discord.Collection();
        this.databaseCache.guilds = new Discord.Collection();
        this.databaseCache.members = new Discord.Collection();
        this.databaseCache.bannedUsers = new Discord.Collection();

        this.logs = require('../models/log');
        this.guildsData = require('../models/guild');
        this.usersData = require('../models/user');
        this.membersData = require('../models/member');


    }

    loadCommand (commandPath, commandName) {
        try {
            const props = new (require(`${commandPath}/${commandName}`))(this);
            props.conf.location = commandPath;
            if (props.init){
                props.init(this);
            }
            this.commands.set(props.help.name, props);
            props.help.aliases.forEach((alias) => {
                this.aliases.set(alias, props.help.name);
            });
            return false;
        } catch (e) {
            return `Couldn't load command ${commandName}: ${e}`;
        }
    }

    async unloadCommand (commandPath, commandName) {
        let command;
        if(this.commands.has(commandName)) {
            command = this.commands.get(commandName);
        } else if(this.aliases.has(commandName)){
            command = this.commands.get(this.aliases.get(commandName));
        }
        if(!command){
            return `Command not found: ${commandName}`;
        }
        if(command.shutdown){
            await command.shutdown(this);
        }
        delete require.cache[require.resolve(`${commandPath}${path.sep}${commandName}.js`)];
        return false;
    }

    async findOrCreateUser({ id: userID }, isLean){
        if(this.databaseCache.users.get(userID)){
            return isLean ? this.databaseCache.users.get(userID).toJSON() : this.databaseCache.users.get(userID);
        } else {
            let userData = (isLean ? await this.usersData.findOne({ id: userID }).lean() : await this.usersData.findOne({ id: userID }));
            if(userData){
                if(!isLean) this.databaseCache.users.set(userID, userData);
                return userData;
            } else {
                userData = new this.usersData({ id: userID });
                await userData.save();
                this.databaseCache.users.set(userID, userData);
                return isLean ? userData.toJSON() : userData;
            }
        }
    }


    async findOrCreateMember({ id: memberID, guildID }, isLean){
        if(this.databaseCache.members.get(`${memberID}${guildID}`)){
            return isLean ? this.databaseCache.members.get(`${memberID}${guildID}`).toJSON() : this.databaseCache.members.get(`${memberID}${guildID}`);
        } else {
            let memberData = (isLean ? await this.membersData.findOne({ guildID, id: memberID }).lean() : await this.membersData.findOne({ guildID, id: memberID }));
            if(memberData){
                if(!isLean) this.databaseCache.members.set(`${memberID}${guildID}`, memberData);
                return memberData;
            } else {
                memberData = new this.membersData({ id: memberID, guildID: guildID });
                await memberData.save();
                const guild = await this.findOrCreateGuild({ id: guildID });
                if(guild){
                    guild.members.push(memberData._id);
                    await guild.save();
                }
                this.databaseCache.members.set(`${memberID}${guildID}`, memberData);
                return isLean ? memberData.toJSON() : memberData;
            }
        }
    }

    usageEmbed(guild, command, data){
        const { client } = require('../app')

        return new MessageEmbed()
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL(), url: client.website})
            .setDescription(guild.translate(command.help.category + "/" + command.help.name  + ":general:usage_description") + "\n" + guild.translate("language:prefix").replaceAll("{prefix}", data.guild.prefix))
            .addFields({
                    name: "\u200b",
                    value: ('```{anwendung}\u200b\u200b```\n{syntax}').replaceAll("{syntax}", guild.translate(command.help.category + "/" + command.help.name  + ":general:syntax")).replaceAll("{prefix}", data.guild.prefix).replaceAll("{anwendung}", guild.translate("language:syntax")),
                    inline: true
                },
                {
                    name: "\u200b",
                    value: ('```{beispiele}```\n{examples}').replaceAll("{examples}", guild.translate(command.help.category + "/" + command.help.name  + ":general:examples")).replaceAll("{prefix}", data.guild.prefix).replaceAll("{beispiele}", guild.translate("language:examples")),
                    inline: true
                },
                {
                    name: "\u200b",
                    value: ('```{userperms}```\n• {perms}'
                        .replaceAll("{perms}", command.conf.memberPermissions.join('\n• '))
                        .replaceAll("{userperms}", guild.translate("language:perms-user"))
                        .replaceAll("CREATE_INSTANT_INVITE", guild.translate("language:permissions:create_instant_invite"))
                        .replaceAll("KICK_MEMBERS", guild.translate("language:permissions:kick_members"))
                        .replaceAll("BAN_MEMBERS", guild.translate("language:permissions:ban_members"))
                        .replaceAll("ADMINISTRATOR", guild.translate("language:permissions:administrator"))
                        .replaceAll("MANAGE_CHANNELS", guild.translate("language:permissions:manage_channels"))
                        .replaceAll("MANAGE_GUILD", guild.translate("language:permissions:manage_guild"))
                        .replaceAll("ADD_REACTIONS", guild.translate("language:permissions:add_reactions"))
                        .replaceAll("VIEW_AUDIT_LOG", guild.translate("language:permissions:view_audit_log"))
                        .replaceAll("PRIORITY_SPEAKER", guild.translate("language:permissions:priority_speaker"))
                        .replaceAll("STREAM", guild.translate("language:permissions:stream"))
                        .replaceAll("VIEW_CHANNEL", guild.translate("language:permissions:view_channel"))
                        .replaceAll("SEND_MESSAGES", guild.translate("language:permissions:send_messages"))
                        .replaceAll("SEND_TTS_MESSAGES", guild.translate("language:permissions:send_tts_messages"))
                        .replaceAll("MANAGE_MESSAGES", guild.translate("language:permissions:manage_messages"))
                        .replaceAll("EMBED_LINKS", guild.translate("language:permissions:embed_links"))
                        .replaceAll("ATTACH_FILES", guild.translate("language:permissions:attach_files"))
                        .replaceAll("READ_MESSAGE_HISTORY", guild.translate("language:permissions:read_message_history"))
                        .replaceAll("MENTION_EVERYONE", guild.translate("language:permissions:mention_everyone"))
                        .replaceAll("USE_EXTERNAL_EMOJIS", guild.translate("language:permissions:use_external_emojis"))
                        .replaceAll("CONNECT", guild.translate("language:permissions:connect"))
                        .replaceAll("SPEAK", guild.translate("language:permissions:speak"))
                        .replaceAll("MUTE_MEMBERS", guild.translate("language:permissions:mute_members"))
                        .replaceAll("DEAFEN_MEMBERS", guild.translate("language:permissions:deafen_members"))
                        .replaceAll("MOVE_MEMBERS", guild.translate("language:permissions:move_members"))
                        .replaceAll("USE_VAD", guild.translate("language:permissions:use_vad"))
                        .replaceAll("CHANGE_NICKNAME", guild.translate("language:permissions:change_nickname"))
                        .replaceAll("MANAGE_NICKNAMES", guild.translate("language:permissions:manage_nicknames"))
                        .replaceAll("MANAGE_ROLES", guild.translate("language:permissions:manage_roles"))
                        .replaceAll("MANAGE_WEBHOOKS", guild.translate("language:permissions:manage_webhooks"))
                        .replaceAll("MANAGE_EMOJIS_AND_STICKERS", guild.translate("language:permissions:manage_emojis_and_stickers"))
                        .replaceAll("USE_APPLICATION_COMMANDS", guild.translate("language:permissions:use_application_commands"))
                        .replaceAll("REQUEST_TO_SPEAK", guild.translate("language:permissions:request_to_speak"))
                        .replaceAll("MANAGE_EVENTS", guild.translate("language:permissions:manage_events"))
                        .replaceAll("MANAGE_THREADS", guild.translate("language:permissions:manage_threads"))
                        .replaceAll("CREATE_PUBLIC_THREADS", guild.translate("language:permissions:create_public_threads"))
                        .replaceAll("CREATE_PRIVATE_THREADS", guild.translate("language:permissions:create_private_threads"))
                        .replaceAll("USE_EXTERNAL_STICKERS", guild.translate("language:permissions:use_external_stickers"))
                        .replaceAll("SEND_MESSAGES_IN_THREADS", guild.translate("language:permissions:send_messages_in_threads"))
                        .replaceAll("USE_EMBEDDED_ACTIVITIES", guild.translate("language:permissions:use_embedded_activities"))
                        .replaceAll("MODERATE_MEMBERS", guild.translate("language:permissions:moderate_members")))
                },
                {
                    name: "\u200b",
                    value: ('```{botperms}```\n• {perms}\n'.replaceAll("{perms}", command.conf.botPermissions.join('\n• '))
                        .replaceAll("{perms}", command.conf.memberPermissions.join('\n• '))
                        .replaceAll("{botperms}", guild.translate("language:perms-bot"))
                        .replaceAll("CREATE_INSTANT_INVITE", guild.translate("language:permissions:create_instant_invite"))
                        .replaceAll("KICK_MEMBERS", guild.translate("language:permissions:kick_members"))
                        .replaceAll("BAN_MEMBERS", guild.translate("language:permissions:ban_members"))
                        .replaceAll("ADMINISTRATOR", guild.translate("language:permissions:administrator"))
                        .replaceAll("MANAGE_CHANNELS", guild.translate("language:permissions:manage_channels"))
                        .replaceAll("MANAGE_GUILD", guild.translate("language:permissions:manage_guild"))
                        .replaceAll("ADD_REACTIONS", guild.translate("language:permissions:add_reactions"))
                        .replaceAll("VIEW_AUDIT_LOG", guild.translate("language:permissions:view_audit_log"))
                        .replaceAll("PRIORITY_SPEAKER", guild.translate("language:permissions:priority_speaker"))
                        .replaceAll("STREAM", guild.translate("language:permissions:stream"))
                        .replaceAll("VIEW_CHANNEL", guild.translate("language:permissions:view_channel"))
                        .replaceAll("SEND_MESSAGES", guild.translate("language:permissions:send_messages"))
                        .replaceAll("SEND_TTS_MESSAGES", guild.translate("language:permissions:send_tts_messages"))
                        .replaceAll("MANAGE_MESSAGES", guild.translate("language:permissions:manage_messages"))
                        .replaceAll("EMBED_LINKS", guild.translate("language:permissions:embed_links"))
                        .replaceAll("ATTACH_FILES", guild.translate("language:permissions:attach_files"))
                        .replaceAll("READ_MESSAGE_HISTORY", guild.translate("language:permissions:read_message_history"))
                        .replaceAll("MENTION_EVERYONE", guild.translate("language:permissions:mention_everyone"))
                        .replaceAll("USE_EXTERNAL_EMOJIS", guild.translate("language:permissions:use_external_emojis"))
                        .replaceAll("CONNECT", guild.translate("language:permissions:connect"))
                        .replaceAll("SPEAK", guild.translate("language:permissions:speak"))
                        .replaceAll("MUTE_MEMBERS", guild.translate("language:permissions:mute_members"))
                        .replaceAll("DEAFEN_MEMBERS", guild.translate("language:permissions:deafen_members"))
                        .replaceAll("MOVE_MEMBERS", guild.translate("language:permissions:move_members"))
                        .replaceAll("USE_VAD", guild.translate("language:permissions:use_vad"))
                        .replaceAll("CHANGE_NICKNAME", guild.translate("language:permissions:change_nickname"))
                        .replaceAll("MANAGE_NICKNAMES", guild.translate("language:permissions:manage_nicknames"))
                        .replaceAll("MANAGE_ROLES", guild.translate("language:permissions:manage_roles"))
                        .replaceAll("MANAGE_WEBHOOKS", guild.translate("language:permissions:manage_webhooks"))
                        .replaceAll("MANAGE_EMOJIS_AND_STICKERS", guild.translate("language:permissions:manage_emojis_and_stickers"))
                        .replaceAll("USE_APPLICATION_COMMANDS", guild.translate("language:permissions:use_application_commands"))
                        .replaceAll("REQUEST_TO_SPEAK", guild.translate("language:permissions:request_to_speak"))
                        .replaceAll("MANAGE_EVENTS", guild.translate("language:permissions:manage_events"))
                        .replaceAll("MANAGE_THREADS", guild.translate("language:permissions:manage_threads"))
                        .replaceAll("CREATE_PUBLIC_THREADS", guild.translate("language:permissions:create_public_threads"))
                        .replaceAll("CREATE_PRIVATE_THREADS", guild.translate("language:permissions:create_private_threads"))
                        .replaceAll("USE_EXTERNAL_STICKERS", guild.translate("language:permissions:use_external_stickers"))
                        .replaceAll("SEND_MESSAGES_IN_THREADS", guild.translate("language:permissions:send_messages_in_threads"))
                        .replaceAll("USE_EMBEDDED_ACTIVITIES", guild.translate("language:permissions:use_embedded_activities"))
                        .replaceAll("MODERATE_MEMBERS", guild.translate("language:permissions:moderate_members")))
                })
            .setColor(client.embedColor)
            .setFooter({text: data.guild.footer});
    }

    async findGuild(guildId) {
        const cachedGuild = this.databaseCache.guilds.get(guildId);
        if(cachedGuild) return cachedGuild;
        return await this.guildsData.findOne({id: guildId});
    }

    async findOrCreateGuild({ id: guildID }, isLean) {
        if (this.databaseCache.guilds.get(guildID)) {
            return isLean ? this.databaseCache.guilds.get(guildID).toJSON() : this.databaseCache.guilds.get(guildID);
        } else {
            let guildData = (isLean ? await this.guildsData.findOne({id: guildID}).populate("members").lean() : await this.guildsData.findOne({id: guildID}).populate("members"));
            if (guildData) {
                if (!isLean) this.databaseCache.guilds.set(guildID, guildData);
                return guildData;
            } else {
                guildData = new this.guildsData({id: guildID});
                await guildData.save();
                this.databaseCache.guilds.set(guildID, guildData);
                return isLean ? guildData.toJSON() : guildData;
            }
        }
    }

    async resolveUser(search){
        let user = null;
        if(!search || typeof search !== "string") return;
        if(search.match(/^<@!?(\d+)>$/)){
            const id = search.match(/^<@!?(\d+)>$/)[1];
            user = this.users.fetch(id).catch(() => {});
            if(user) return user;
        }
        if(search.match(/^!?(\w+)#(\d+)$/)){
            let userTag = search.match(/^!?(\w+)#(\d+)$/)[0];
            const username = userTag.split('#')[0]
            const discriminator = userTag.split('#')[1]
            user = this.users.cache.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.discriminator === discriminator);
            if(user) return user;
        }
        user = await this.users.fetch(search).catch(() => {});
        return user;
    }

    async resolveMember(search, guild){
        let member = null;
        if(!search || typeof search !== "string") return;
        if(search.match(/^<@!?(\d+)>$/)){
            const id = search.match(/^<@!?(\d+)>$/)[1];
            member = await guild.members.fetch(id).catch(() => {});
            if(member) return member;
        }
        if(search.match(/^!?(\w+)#(\d+)$/)){
            guild = await guild.fetch();
            member = guild.members.cache.find((m) => m.user.tag === search);
            if(member) return member;
        }
        member = await guild.members.fetch(search).catch(() => {});
        return member;
    }

    async resolveRole(search, guild) {
        let role = null;
        if (!search || typeof search !== "string") return;
        if (search.match(/^<@&!?(\d+)>$/)) {
            const id = search.match(/^<@&!?(\d+)>$/)[1];
            role = guild.roles.cache.get(id);
            if (role) return role;
        }
        role = guild.roles.cache.find((r) => search === r.name);
        if (role) return role;
        role = guild.roles.cache.get(search);
        return role;
    }
}
module.exports = Bot;