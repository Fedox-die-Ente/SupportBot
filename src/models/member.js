const mongoose = require('mongoose');

module.exports = mongoose.model("Member", new mongoose.Schema({

    id: { type: String },
    guildID: { type: String },

    warnings: { list: [],  count: { type: Number, default: 0 } },
    ban: {
        type: Object,
        default: {
            banned: false,
            reason: null,
            moderator: {
                id: null,
                tag: null
            },
            duration: null,
            bannedAt: null,
            endDate: null
        }
    }
}));