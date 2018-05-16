const { Client, Util } = require("discord.js");
const { TOKEN, PREFIX } = require("./config");
const { stripIndents } = require("common-tags");
const ytdl = require("ytdl-core");

const client = new Client({ disableEveryone: true });

const queue = new Map();

client.on("warn", console.warn);

client.on("error", console.error);

client.on("ready", () => console.log("Music system ready"));

client.on("disconnect", () => console.log("Bot disconnecting..."));

client.on("reconnecting", () => console.log("Reconnecting..."));

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.split(" ");
    const serverQueue = queue.get(message.guild.id);

    // PLAY COMMAND
    if (message.content.startsWith(`${PREFIX}play`)) {
        const voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return message.channel.send("You must be in a voice channel to be able to play music.");

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.channel.send("I cannot connect to your voice channel, due to insufficient permissions.");
        if (!permissions.has("SPEAK")) return message.channel.send("I cannot play any music, as I do not have the \"Speak\" permission.");

        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
            title: Util.escapeMarkdown(songInfo.title),
            url: songInfo.video_url
        };

        if (!serverQueue) {
            const queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(message.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                const connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(message.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`Couldn't join voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return message.channel.send(`I couldn't join your voice channel:\n\`\`\`${error.message}\`\`\``);
            }
        } else {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);
            return message.channel.send(`**${song.title}** has been added to the queue.`);
        }
        return;

        // SKIP COMMAND
    } else if (message.content.startsWith(`${PREFIX}skip`)) {
        if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
        if (!serverQueue) return message.channel.send("There is nothing currently playing that can be skipped.");
        serverQueue.connection.dispatcher.end("Skip command used");

        // STOP COMMAND
    } else if (message.content.startsWith(`${PREFIX}stop`)) {
        if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
        if (!serverQueue) return message.channel.send("There is nothing currently playing that can be stopped.");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("Stop command used");
        return message.channel.send("Music stopped.");
        
        // VOLUME COMMAND
    } else if (message.content.startsWith(`${PREFIX}volume`) || message.content.startsWith(`${PREFIX}vol`)) {
        if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
        if (!serverQueue) return message.channel.send("There is nothing currently playing.");
        if (!args[1]) return message.channel.send(`Current volume: **${serverQueue.volume}**.`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return message.channel.send(`Volume set to **${args[1]}**.\nThe default volume level is 5.`);

        // NOW PLAYING COMMAND
    } else if (message.content.startsWith(`${PREFIX}np`) || message.content.startsWith(`${PREFIX}song`)) {
        if (!serverQueue) return message.channel.send("There is nothing currently playing.");
        return message.channel.send(`Now playing: **${serverQueue.songs[0].title}**.`);

        // QUEUE COMMAND
    } else if (message.content.startsWith(`${PREFIX}queue`)) {
        if (!serverQueue) return message.channel.send("There is nothing currently playing.");
        return message.channel.send(stripIndents`
        __**Song Queue**__

        ${serverQueue.songs.map(song => `• ${song.title}`).join("\n")}

        **Now playing**: ${serverQueue.songs[0].title}
        `);

        // PAUSE COMMAND
    } else if (message.content.startsWith(`${PREFIX}pause`)) {
        if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
        if (serverQueue && serverQueue.playing) {
            if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
            if (!serverQueue && !serverQueue.playing) return message.channel.send("There is nothing currently playing.");
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send("Paused.");
        }
        return message.channel.send("There is nothing currently playing.");

        // RESUME COMMAND
    } else if (message.content.startsWith(`${PREFIX}resume`)) {
        if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
        if (serverQueue && !serverQueue.playing) {
            if (!message.member.voiceChannel) return message.channel.send("You must be in a voice channel to use this command.");
            if (!serverQueue && !serverQueue.playing) return message.channel.send("There is nothing currently playing.");
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send("Resuming...");
        }
        return message.channel.send("There is nothing currently playing.");
    }

    return;
});

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on("end", reason => {
            if (reason === "Stream is not generating quickly enough.") console.log("Song ended");
            else console.log(reason);
            console.log("Song ended");
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`Started playing **${song.title}**.`);
}

client.login(TOKEN);