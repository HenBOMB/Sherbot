const { MusicDefaultCheck } = require('../../../tools/utils.js');

var client;

module.exports = 
{
    commands:['pause', 'wait'],

    execute : async function(message, embed)
    {
        if(MusicDefaultCheck(message) != undefined)
            return;
        
        const music = client.music.get(message.guild.id);

        if(music.player.pause(true))
        {
            embed.setDescription(`Track has been paused :pause_button:`).setColor("202225");
        }
        else
        {
            if(music.player.unpause())
            {
                embed.setDescription(`Track has been resumed :play_pause:`).setColor("202225");
            }
            else
            {
                embed.setDescription(`There are no tracks currently playing`).setColor("e50000");
            }
        }

        message.channel.send({ embeds: [embed] });
    },
    
    initialize : async function(c, con, data)
    {
        client = c;
    },
}