const Command = require("../../base/Command.js");
const snekfetch = require("snekfetch");

class ChangeMyMind extends Command {
    constructor(client) {
      super(client, {
        name: "changemymind",
        description: "Change my mind...",
        category: "Image",
        usage: "changemymind <text>",
        aliases: ["change-my-mind", "change"]
      });
    }

    async run(message, args, level, settings, texts) { // eslint-disable-line no-unused-vars
      const text = args.join(" ");
      if (!text) return message.channel.send("You must provide some text to appear on the image.");

      message.channel.startTyping();

      try {
        const { body } = await snekfetch.get(`https://nekobot.xyz/api/imagegen?type=changemymind&text=${encodeURIComponent(text)}`);
        message.channel.send("", { file: body.message });
        message.channel.stopTyping(true);
      } catch (error) {
        this.client.logger.error(error);
        return message.channel.send(texts.general.error.replace(/{{err}}/g, error.message));
      }
    }
}

module.exports = ChangeMyMind;
