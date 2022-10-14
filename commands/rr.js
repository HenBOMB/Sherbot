const { 
    EmbedBuilder, 
    PermissionFlagsBits, 
    SlashCommandBuilder, 
    SlashCommandSubcommandBuilder, 
    SlashCommandStringOption, 
    SlashCommandRoleOption
} = require('discord.js');

module.exports = {

    guildId: '670107546480017409',

    ephemeral: true,

    builder: new SlashCommandBuilder()
        .setName('rr')
        .setDescription('Reaction roles utility')
        .setDMPermission(false)
        // ? create [title] [description]
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('create')
                .setDescription('Creates a blank reaction role message')
                // ? title
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('title')
                        .setDescription('The title of the reaction roles message')
                        .setRequired(true)
                )
                // ? description
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('description')
                        .setDescription('The description of the reaction roles message')
                        .setRequired(true)
                )
        )
        // ? add [id] [role] [emoji]
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('add')
                .setDescription('Adds a reaction role to the message')
                // ? title
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('id')
                        .setDescription('The title of the reaction roles message')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                // ? emoji
                .addRoleOption(
                    new SlashCommandRoleOption()
                        .setName('role')
                        .setDescription('Role to give out')
                        .setRequired(true)
                )
                // ? role
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('emoji')
                        .setDescription('Emoji used as reaction')
                        .setRequired(true)
                        .setMaxLength(1)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    ,

    initialize: function(client)
    {
        process.reactionRoles = { };

        process.conn.query(`SELECT * FROM reaction_roles`, (err, res) => {
            process.logError(err);
            res.forEach(data => {
                process.reactionRoles[data.id] = data.roles.split(',').filter(Boolean);
            });
        });

        client.on('messageDelete', async ({ id }) => {
            if(!process.reactionRoles[id]) return;
            
            delete process.reactionRoles[id];
        
            process.conn.query(`DELETE FROM reaction_roles WHERE id = '${id}'`, process.logError);
        });
        
        client.on('messageReactionAdd', async ({ message, me, emoji }, user) => {
            if(me || !process.reactionRoles[message.id]) return;
            const i = message.reactions.cache.map(v => v.emoji.name).indexOf(emoji.name);
            if(i < 0) return;
            const roleid = process.reactionRoles[message.id][i];
            if(!roleid) return;
            (await message.guild.members.fetch(user.id)).roles.add(roleid);
        });
        
        client.on('messageReactionRemove', async ({ message, me, emoji }, user) => {
            if(me || !process.reactionRoles[message.id]) return;
            const i = message.reactions.cache.map(v => v.emoji.name).indexOf(emoji.name);
            if(i < 0) return;
            const roleid = process.reactionRoles[message.id][i];
            if(!roleid) return;
            (await message.guild.members.fetch(user.id)).roles.remove(roleid);
        });
    },

    interact : async function(interaction)
    {
        const { options, channel } = interaction;

        const id = options.getString('id');
        const message = id? await channel.messages.fetch(id).catch(() => {}) : null;
        
        if(id && !message) return `Invalid message ID: ${id}`;

        if(message && !process.reactionRoles[id]) return `That ID does not belong to a reaction role message.`;

        switch (options.getSubcommand()) {
            case 'create':
                embed = new EmbedBuilder()
                    .setTitle(options.getString('title'))
                    .setDescription(options.getString('description')||'ㅤ');
                const msg = await channel.send({ embeds: [embed] });
                process.reactionRoles[msg.id] = [];
                process.conn.query(`INSERT INTO reaction_roles (id,roles) VALUES ('${msg.id}','')`, process.logError);
                return `Message created with ID: ${msg.id}`;

            case 'add':
                process.reactionRoles[id].push(options.getRole('role').id);
                process.conn.query(`UPDATE reaction_roles SET roles = '${process.reactionRoles[id].join(',')}'`, process.logError);
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