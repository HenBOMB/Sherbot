const { MusicDefaultCheck } = require('../../../tools/utils.js');

var client;

module.exports = 
{
    commands:['skip', 's'],

    execute : async function(message, embed)
    {
        if(MusicDefaultCheck(message) != undefined)
            return;

        const music = client.music.get(message.guild.id);

        if(music.skip())
            embed.setDescription(`Skipped **[${music.current.title}](${music.current.url})**`).setColor("202225");
        else
            embed.setDescription(`There are no tracks currently playing`).setColor("e50000");

        message.channel.send({ embeds: [embed] });
    },
    
    initialize : async function(c, con, data)
    {
        client = c;
    },
}