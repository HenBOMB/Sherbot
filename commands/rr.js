const { EmbedBuilder } = require('discord.js');

const reactionRoles = { };

module.exports =
{
    description: "Reaction roles utility.",

    options: [
        {
            type: 1,
            name: "create",
            description: "Creates a blank reaction role message.",
            options: [
                {
                    type: 3,
                    name: "title",
                    description: "The title of the reaction roles message.",
                    required: true
                },
                {
                    type: 3,
                    name: "description",
                    description: "The description of the reaction roles message."
                }
            ]
        },
        {
            type: 1,
            name: "add",
            description: "Adds a reaction role to the message.",
            options: [
                {
                    type: 3,
                    name: "id",
                    description: "The reaction role message to target.",
                    required: true
                },
                {
                    type: 8,
                    name: "role",
                    description: "Role to give out.",
                    required: true
                },
                {
                    type: 3,
                    name: "emoji",
                    description: "Emoji used to react.",
                    required: true
                }
            ]
        },
        {
            type: 1,
            name: "edit",
            description: "Sets a new title or description of reaction role message.",
            options: [
                {
                    type: 3,
                    name: "id",
                    description: "The reaction role message to target.",
                    required: true
                },
                {
                    type: 3,
                    name: "title",
                    description: "A new title.",
                },
                {
                    type: 3,
                    name: "description",
                    description: "A new description.",
                }
            ]
        }
    ],

    // ? @Director
    roles: ['742750595345022978'],

    ephemeral: true,

    initialize: function(client)
    {
        process.conn.query(`SELECT * FROM reaction_roles`, (err, res) => {
            res.forEach(data => {
                // ! Somtimes the first item is empty..
                reactionRoles[data.id] = data.roles.split(',').filter(v => v.length > 3);
            });
        });

        client.on('messageDelete', async ({ id }) => {
            if(!reactionRoles[id]) return;
            
            delete reactionRoles[id];
        
            process.conn.query(`DELETE FROM reaction_roles WHERE id = '${id}'`, (err, res) => { });
        });
        
        client.on('messageReactionAdd', async ({ message, me, emoji }, user) => {
            if(me || !reactionRoles[message.id]) return;
            const i = message.reactions.cache.map(v => v.emoji.name).indexOf(emoji.name);
            if(i < 0) return;
            const roleid = reactionRoles[message.id][i];
            if(!roleid) return;
            (await message.guild.members.fetch(user.id)).roles.add(roleid);
        });
        
        client.on('messageReactionRemove', async ({ message, me, emoji }, user) => {
            if(me || !reactionRoles[message.id]) return;
            const i = message.reactions.cache.map(v => v.emoji.name).indexOf(emoji.name);
            if(i < 0) return;
            const roleid = reactionRoles[message.id][i];
            if(!roleid) return;
            (await message.guild.members.fetch(user.id)).roles.remove(roleid);
        });
    },

    interact : async function({ options, channel })
    {
        const id = options.getString('id');
        const message = id? await channel.messages.fetch(id).catch(() => {}) : null;
        
        if(id && !message) return `Invalid message ID: ${id}`;

        if(message && !reactionRoles[id]) return `That ID does not belong to a reaction role message.`;

        switch (options.getSubcommand()) {
            case 'create':
                embed = new EmbedBuilder()
                    .setTitle(options.getString('title'))
                    .setDescription(options.getString('description')||'ㅤ');
                const msg = await channel.send({ embeds: [embed] });
                reactionRoles[msg.id] = [];
                process.conn.query(`INSERT INTO reaction_roles (id,roles) VALUES ('${msg.id}','')`, (err, res) => { });
                return `Message created with ID: ${msg.id}`;

            case 'add':
                reactionRoles[id].push(options.getRole('role').id);
                process.conn.query(`UPDATE reaction_roles SET roles = '${reactionRoles[id].join(',')}'`, (err, res) => { });
                await message.react(options.getString('emoji'));
                return `Added RR ${options.getRole('role')} with ${options.getString('emoji')}`;

            case 'edit':
                embed = new EmbedBuilder(message.embeds[0].data)
                    .setDescription(options.getString('description') || message.embeds[0].data.description)
                    .setTitle(options.getString('title') || message.embeds[0].data.title);
                await message.edit({ embeds: [embed] });
                return `Successfully edited RR message.`;
        }
    }
};