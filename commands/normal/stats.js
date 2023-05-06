const moment = require("moment");
require("moment-duration-format");
const { MessageEmbed } = require("discord.js");
const os = require("os");

module.exports = {
    name: "status",
    category: "Util",
    description: "see bot status",
    args: false,
    usage: "",
    permission: [],
    aliases: ["status", "stats", "info", "botstatus"],

    run: async (message, args, client, prefix) => {

        // get OS info
    const osver = os.platform() + " " + os.release();

    // Get nodejs version
    const nodeVersion = process.version;
    
    // Get Processor name
    const processor = os.cpus()[0].model;

    // Get Processor cores
    const cores = os.cpus().length;


    // get the uptime in a human readable format
    const runtime = moment
      .duration(client.uptime)
      .format("d[ Days]・h[ Hrs]・m[ Mins]・s[ Secs]");
    // show lavalink uptime in a nice format
    const lavauptime = moment
      .duration(client.manager.nodes.values().next().value.stats.uptime)
      .format(" D[d], H[h], m[m]");
    // show lavalink memory usage in a nice format
    const lavaram = (
      client.manager.nodes.values().next().value.stats.memory.used /
      1024 /
      1024
    ).toFixed(2);
    // sow lavalink memory alocated in a nice format
    const lavamemalocated = (
      client.manager.nodes.values().next().value.stats.memory.allocated /
      1024 /
      1024
    ).toFixed(2);
    // show system uptime
    var sysuptime = moment
      .duration(os.uptime() * 1000)
      .format("d[ Days]・h[ Hrs]・m[ Mins]・s[ Secs]");

    // get commit hash and date
    let gitHash = "unknown";
    try {
      gitHash = require("child_process")
        .execSync("git rev-parse HEAD")
        .toString()
        .trim();
    } catch (e) {
      // do nothing
      gitHash = "unknown";
    }

    const statsEmbed = new MessageEmbed()
      .setTitle(`${client.user.username} Status`)
      .setColor(client.config.embedColor)
      .setDescription(
        `\`\`\`yml\nName: ${client.user.username}#${client.user.discriminator} [${client.user.id}]\nWS: ${client.ws.ping}ms\nUptime: ${runtime}\`\`\``
      )
      .setFields([
        {
          name: `Lavalink stats`,
          value: `\`\`\`yml\nUptime: ${lavauptime}\nRAM: ${lavaram} MB\nPlaying: ${
            client.manager.nodes.values().next().value.stats.playingPlayers
          } out of ${
            client.manager.nodes.values().next().value.stats.players
          }\`\`\``,
          inline: false,
        },
        {
          name: "Bot stats",
          value: `\`\`\`yml\nGuilds: ${
            client.guilds.cache.size
          } \nNodeJS: ${nodeVersion}\nDiscordMusicBot: v${
            require("../../package.json").version
          } \`\`\``,
          inline: false,
        },
        {
          name: "System stats",
          value: `\`\`\`yml\nPlatform: ${osver}\nUptime: ${sysuptime}\nProcessor: ${processor}\nCore: ${cores} Core(s)\`\`\``,
          inline: false,
        },
      ])
      .setFooter({ text: `Build: ${gitHash}` });
    return message.reply({ embeds: [statsEmbed], ephemeral: false });
    }
}