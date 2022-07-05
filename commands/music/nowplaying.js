const { MusicDefaultCheck } = require('../../../tools/utils.js');

var client;

module.exports = 
{
    commands:['playing', 'now', 'np'],

    execute : async function(message, embed)
    {
        if(MusicDefaultCheck(message) != undefined)
            return;
        
        const music = client.music.get(message.guild.id);

        if(music.current)
        {
            embed
            .setAuthor("Now Playing ♪", message.guild.members.cache.get('712429527321542777').displayAvatarURL())
            .setDescription(`**Playing**\n**[${music.current.title}](${music.current.url})**`)
            .setThumbnail(music.current.thumbnail)
            .setFooter(`Requested by ${message.guild.members.cache.get(music.current.id).user.discriminator}`)
            .setTimestamp()
            .setColor("202225");
        }
        else
            embed.setDescription(`There are no tracks currently playing`).setColor("e50000");

        message.channel.send({ embeds: [embed] });
    },
    
    initialize : async function(c, con, data)
    {
        client = c;
    },
}