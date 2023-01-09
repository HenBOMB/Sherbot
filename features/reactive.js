// ? Feature for handling react-action-response

module.exports = {
    initialize: function(client)
    {
        client.on('messageReactionAdd', async ({ message, me, emoji }, user) => {
            if(user.bot || me) return;
            if(emoji.name === '🔁') 
            {
                message.channel.send({ embeds: (await message.fetch()).embeds});
            }
        });
    },
}
