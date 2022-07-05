const { MusicDefaultCheck } = require('../../../tools/utils.js');

var client;

module.exports = 
{
    commands:['stop', 'halt'],

    execute : async function(message, embed)
    {
        if(MusicDefaultCheck(message) != undefined)
            return;

        const music = client.music.get(message.guild.id);

        if(music.player.stop())
        {
            embed.setDescription(`Tracks dequeued and stopped :stop_button:`).setColor("202225");
            music.exit();
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