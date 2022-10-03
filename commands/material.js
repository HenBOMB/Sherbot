
// const { EmbedBuilder, Colors } = require('discord.js');

const timeouts = {}

module.exports =
{
    // description: "Gain temporary access to secret sherlock material..",

    ephemeral: true,

    interact : async function({ member })
    {
        await member.roles.add('845953749087944716');

        const out = member.id in timeouts ? 'Your timer has been refreshed!' : 'Access granted! Your time will expire in 1 hour.';

        if(member.id in timeouts)
        {
            clearTimeout(timeouts[member.id]);
        }

        {
            const _member = member;

            timeouts[member.id] = setTimeout(async () => {
                await _member.roles.remove('845953749087944716');

                // const channel = await _member.user.createDM();
                // const embeds = [
                //     new EmbedBuilder()
                //         .setColor(Colors.Orange)
                //         .setDescription('Your session has expired.\nㅤ\n⌛ Make sure to re-gain access with `/material`!\nㅤ')
                //         .setFooter({ "text": "The Art Of Deduction | Sherlock Holmes" })
                //         .setTimestamp()
                // ]
                // channel.send({ embeds });

                delete timeouts[_member.id];
            }, 3600000);
        }

        return out;
    }
};
