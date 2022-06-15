const { red, green, yellow, blue, magenta, cyan, white, gray, black, bold } = require("chalk");

function dateTimePad(value, digits) {
    let number = value;
    while (number.toString()
        .length < digits) {
        number = "0" + number;
    }
    return number;
}

function format(tDate) {
    return (dateTimePad(tDate.getDate(), 2) + "." +
        dateTimePad(tDate.getMonth(), 2) + "." +
        dateTimePad(tDate.getFullYear()) + " " +
        dateTimePad(tDate.getHours(), 2) + ":" +
        dateTimePad(tDate.getMinutes(), 2) + ":" +
        dateTimePad(tDate.getSeconds(), 2))
}

module.exports = class Logger {
    static log(text, type = "info") {
        const date = `[${format(new Date(Date.now()))}]:`;
        switch(type) {
            case "info":
            {
                return console.log(`${date} ${bold(blue(type.toUpperCase()))} ${text} `);
            }
            case "debug":
            {
                return console.log(`${date} ${bold(yellow(type.toUpperCase()))} ${text}`)
            }
            case "ready":
            {
                return console.log(`${date} ${bold(green(type.toUpperCase()))} ${text}`)
            }
            case "load":
            {
                return console.log(`${date} ${bold(black(type.toUpperCase()))} ${text}`)
            }
            case "error":
            {
                return console.log(`${date} ${bold(red(type.toUpperCase()))} ${text}`)
            }
            case "warn":
            {
                return console.log(`${date} ${bold(magenta(type.toUpperCase()))} ${text}`)
            }
            case "success":
            {
                return console.log(`${date} ${bold(green(type.toUpperCase()))} ${text}`)
            }
            default:
            {
                return console.log(`${date} ${bold(black("LOG"))} ${text}`)
            }
        }
    }
}