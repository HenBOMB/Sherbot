const { MusicDefaultCheck } = require('../../../tools/utils.js');

var client;

module.exports = 
{
    commands:['leave', 'quit', 'fuckoff', 'kys', 'despacito'],

    execute : async function(message, embed)
    {
        const vc = message.member.voice.channel;

        if (!vc)
            return message.channel.send("Oi dum dum, you need to be in vc to use this command.");

        const music = client.music.get(message.guild.id);

        if(music)
        {
            music.disconnect();
            embed.setDescription(
`Thank you for using our service!

**Loving the bot?**
Consider ~~becoming a patreon to support our hard work and the future development of the bot, even just a dollar if you can~~ paying me :heart:
`)
            .setImage("https://media.discordapp.net/attachments/871211833837629521/910670765660205056/image.png?width=1025&height=305")
            .setColor('a53f4e');
            message.channel.send({ embeds: [embed] });
        }
        else
            message.channel.send("Does it look like im in a vc? No, you single brain celled individual.");
    },
    
    initialize : async function(c, con, data)
    {
        client = c;
    },
}