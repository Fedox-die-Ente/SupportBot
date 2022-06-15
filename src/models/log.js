const mongoose = require('mongoose');

module.exports = mongoose.model("Log", new mongoose.Schema({
    command: { type: String, default: "unknown" },
    args: { type: Array, default: [] },
    type: { type: String, default: "unknown" },
    date: { type: Number, default: Date.now() },
    executor: {
        type: Object,
        default: {
            username: "unknown",
            discriminator: "0000",
            id: null,
            createdAt: { type: Number, default: Date.now() }
        }
    },
    guild: {
        type: Object,
        default: {
            name: "unknown",
            id: null,
            createdAt: { type: Number, default: Date.now() }
        }
    },
}))