const { EmbedBuilder, Colors } = require('discord.js');

// ? /rr [new, edit] (#channel, messageid) --{ghost, clear, delete, desc, role [@role] [emoji]}
// ? /rr edit 1020033297209892965 --role @member :emote: --role @arg 🚦 --ghost

const reactionRoles = { };

// TODO emoji cannot be stored in db. Find workaround.

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
                    type: 4,
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
                    type: 4,
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
                reactionRoles[data.id] = { };

                const emojis = data.emojis.split(',');
                const roles = data.roles.split(',');

                for (let i = 0; i < emojis.length; i++)
                    reactionRoles[data.id][emojis[i]] = roles[i];
            });
        });

        client.on('messageDelete', async ({ id }) => {
            if(!reactionRoles[id]) return;
            
            delete reactionRoles[id];
        
            process.conn.query(`DELETE FROM reaction_roles WHERE id = '${id}'`, (err, res) => { });
        });
        
        client.on('messageReactionAdd', async ({ emoji, message, me }, user) => {
            // console.log(message.reactions.cache.map(v => v.emoji.name));
            
            if(me || !reactionRoles[message.id]) return;
            
            const role = reactionRoles[message.id][emoji.name];
            const member = await message.guild.members.fetch(user.id);
            
            await member.roles.add(role);
        });
        
        client.on('messageReactionRemove', async ({ emoji, message, me }, user) => {
            if(me || !reactionRoles[message.id]) return;
            
            const role = reactionRoles[message.id][emoji.name];
            const member = await message.guild.members.fetch(user.id);
            
            await member.roles.remove(role);
        });
    },

    interact : async function({ options, channel })
    {
        let message = options.getInteger('id')? await channel.messages.fetch(`${options.getInteger('id')}`) : null;
        let embed = message? message.embeds[0] : new EmbedBuilder();

        switch (options.getSubcommand()) {
            case 'create':
                embed = embed
                    .setTitle(options.getString('title'))
                    .setDescription(options.getString('description')||'ㅤ');
                message = await channel.send({ embeds: [embed] });
                return `Message created with ID: ${message.id}`;

            case 'add':
                process.conn.query(`SELECT roles, emojis FROM reaction_roles WHERE id='${message.id}'`, (err, res) => {
                    const roles = res[0].roles.split(',');
                    const emojis = res[0].roles.split(',');
                    roles.push(options.getRole('role').id);
                    emojis.push(options.getString('emoji'));
                    process.conn.query(`UPDATE reaction_roles SET roles = '${roles.join(',')}', emojis = '${emojis.join(',')}'`, (err, res) => { });
                });
                await message.react(options.getString('emoji'));
                return `Added rr ${options.getRole('role')} with emoji ${options.getString('emoji')}`;

            case 'edit':
                embed = embed
                    .setDescription(options.getString('description'))
                    .setTitle(options.getString('title'));
                await channel.edit({ embeds: [embed] });
                return `Successfully edited rr message.`;
        }
    }
};