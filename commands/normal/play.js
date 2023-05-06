const { MessageEmbed } = require("discord.js");
const escapeMarkdown = require("discord.js").Util.escapeMarkdown;

module.exports = {
    name: "play",
    category: "Music",
    description: "Play your favourite song",
    args: false,
    usage: "",
    permission: [],
    aliases: ["p"],

    run: async (message, args, client, prefix) => {

        let channel = await client.getChannel(client, message);
    if (!channel) {
      return;
    }

    let node = await client.getLavalink(client);
    if (!node) {
      return message.reply({
        embeds: [client.ErrorEmbed("Lavalink node is not connected")],
      });
    }

    let player = client.createPlayer(message.channel, channel);

    if (player.state !== "CONNECTED") {
      player.connect();
    }

    if (channel.type == "GUILD_STAGE_VOICE") {
      setTimeout(() => {
        if (message.guild.members.me.voice.suppress == true) {
          try {
            message.guild.members.me.voice.setSuppressed(false);
          } catch (e) {
            message.guild.members.me.voice.setRequestToSpeak(true);
          }
        }
      }, 2000); // Need this because discord api is buggy asf, and without this the bot will not request to speak on a stage - Darren
    }

    const ret = await message.reply({
      embeds: [
        new MessageEmbed()
          .setColor(client.config.embedColor)
          .setDescription(":mag_right: **Searching...**"),
      ],
    });

    let query = args.join(" ");
    let res = await player.search(query, message.author).catch((err) => {
      client.error(err);
      return {
        loadType: "LOAD_FAILED",
      };
    });

    if (res.loadType === "LOAD_FAILED") {
      if (!player.queue.current) {
        player.destroy();
      }
      await message
        .reply({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription("There was an error while searching"),
          ],
        })
        .catch(this.warn);
    }

    if (res.loadType === "NO_MATCHES") {
      if (!player.queue.current) {
        player.destroy();
      }
      await message
        .reply({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription("No results were found"),
          ],
        })
        .catch(this.warn);
    }

    if (res.loadType === "TRACK_LOADED" || res.loadType === "SEARCH_RESULT") {
      player.queue.add(res.tracks[0]);

      if (!player.playing && !player.paused && !player.queue.size) {
        player.play();
      }
      var title = escapeMarkdown(res.tracks[0].title);
      var title = title.replace(/\]/g, "");
      var title = title.replace(/\[/g, "");
      let addQueueEmbed = new MessageEmbed()
        .setColor(client.config.embedColor)
        .setAuthor({ name: "Added to queue", iconURL: client.config.iconURL })
        .setDescription(`[${title}](${res.tracks[0].uri})` || "No Title")
        .setURL(res.tracks[0].uri)
        .addFields(
          {
            name: "Added by",
            value: `<@${message.author.id}>`,
            inline: true,
          },
          {
            name: "Duration",
            value: res.tracks[0].isStream
              ? `\`LIVE 🔴 \``
              : `\`${client.ms(res.tracks[0].duration, {
                  colonNotation: true,
                  secondsDecimalDigits: 0,
                })}\``,
            inline: true,
          }
        );

      try {
        addQueueEmbed.setThumbnail(
          res.tracks[0].displayThumbnail("maxresdefault")
        );
      } catch (err) {
        addQueueEmbed.setThumbnail(res.tracks[0].thumbnail);
      }

      if (player.queue.totalSize > 1) {
        addQueueEmbed.addFields({
          name: "Position in queue",
          value: `${player.queue.size}`,
          inline: true,
        });
      } else {
        player.queue.previous = player.queue.current;
      }

      await message.reply({ embeds: [addQueueEmbed] }).catch(this.warn);
    }

    if (res.loadType === "PLAYLIST_LOADED") {
      player.queue.add(res.tracks);

      if (
        !player.playing &&
        !player.paused &&
        player.queue.totalSize === res.tracks.length
      ) {
        player.play();
      }

      let playlistEmbed = new MessageEmbed()
        .setColor(client.config.embedColor)
        .setAuthor({
          name: "Playlist added to queue",
          iconURL: client.config.iconURL,
        })
        .setThumbnail(res.tracks[0].thumbnail)
        .setDescription(`[${res.playlist.name}](${query})`)
        .addFields(
          {
            name: "Enqueued",
            value: `\`${res.tracks.length}\` songs`,
            inline: true,
          },
          {
            name: "Playlist duration",
            value: `\`${client.ms(res.playlist.duration, {
              colonNotation: true,
              secondsDecimalDigits: 0,
            })}\``,
            inline: true,
          }
        );

      await message.reply({ embeds: [playlistEmbed] }).catch(this.warn);
    }

    if (ret) setTimeout(() => ret.delete().catch(this.warn), 20000);
    return ret;
    }
}
