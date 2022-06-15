const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    id: { type: String },
    levelColor: { type: String, default: "5773c9" },
    levelBackground: { type: Number, default: 0 },
    blocked: { type: Boolean,  default: false },
    afk: { type: Object, default: {
            status: false,
            reason: null,
            since: null
        }}
});


module.exports = mongoose.model("User", userSchema);