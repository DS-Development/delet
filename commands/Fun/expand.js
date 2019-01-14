const Command = require("../../base/Command.js");
const snekfetch = require("snekfetch");

class Expand extends Command {
    constructor(client) {
      super(client, {
        name: "expand",
        description: "Makes the specified text T H I C C",
        category: "Fun",
        usage: "expand <text>"
      });
    }

    async run(message, args, level, settings, texts) { // eslint-disable-line no-unused-vars
        const text = encodeURIComponent(args.join(" "));
        if (!text) return message.channel.send("You must provide some text to expand.");
        try {
            const { body } = await snekfetch.get(`http://artii.herokuapp.com/make?text=${text}`);
            if (body.length > 2000) return message.channel.send("Unfortunately, the specified text is too long. Please try again with something a little shorter.");
            return message.channel.send(body, { code: "fix" });
        } catch (error) {
            this.client.logger.error(error);
            return message.channel.send(texts.general.error.replace(/{{err}}/g, error));
        }
    }
}

module.exports = Expand;
