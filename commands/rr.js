const { EmbedBuilder } = require('discord.js');
const CLI = require('../scripts/cli');

//?rr [new, edit] (#channel, messageid) --{ghost, clear, delete, desc, role [@role] [emoji]}

module.exports =
{
    commands: ['rr'],

	execute : async function (message, embed, args, cmd) 
    {
        const cli = new CLI();

        var rrMsg = null;

        // ? Example:
        // ? ?rr edit 1020033297209892965 --role @member :emote: --role @arg 🚦 --ghost
        // ? ?rr edit 1020033297209892965 --role @Colors :emote: --ghost

        cli.add('ghost', 'Input message cleared', async () => {
            await message.delete();
        })
        .add('clear', 'Content cleared', async () => {
            if(!rrMsg) return false;
            await rrMsg.edit({ embeds: [new EmbedBuilder().setDescription('Template')] });
        })
        .add('delete', 'Message deleted', async () => {
            if(!rrMsg) return false;
            await rrMsg.delete();
            rrMsg = null;
        })
        .add('desc', 'Description updated', async (content) => {
            if(!rrMsg) return false;
            await rrMsg.edit({ embeds: [rrMsg.embeds[0].setDescription(content)] });
        })
        .add('role', 'Roles updated', async (content) => {
            if(!rrMsg) return false;

            // * @color 🎻
            const rolename = content.match(/@\w+/gm).slice(1);
            const emoji = content.replace(/@\w+ /gm, '').trim();
            const valid = rrMsg.mentions.roles.filter(role => role.name === rolename)[0];
            
            if(!valid || !emoji) return false;

            await rrMsg.react(emoji);
        })
        .execute(message.content).log();
    },

    initialize : function(conn)
    {
        
    }
};