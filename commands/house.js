const { 
    EmbedBuilder, Colors, 
    SlashCommandBuilder, 
    SlashCommandSubcommandBuilder, 
    SlashCommandStringOption, 
    SlashCommandBooleanOption, 
    SlashCommandAttachmentOption,
    SlashCommandUserOption,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const Houses = require('../scripts/houses');

const oopsErr = `
🏚️ Uh oh.. Looks like an error occured whilst running this command.

Do not panic, this has been reported and will soon be fixed!

Please try again later.`

// TODO 10/5 5:47am update slash commands

module.exports = {

    ephemeral: true,

    data: new SlashCommandBuilder()
        .setName('house')
        .setDescription('House utility commands')
        // ? join [id]
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('join')
                .setDescription('Join and be part of a server House!')
                // ? id
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('id')
                        .setDescription('The ID of the house to join')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
                // .setNameLocalization({
                //     'es-ES': 'Join and be part of a server House!'
                // })
                // .setDescriptionLocalization({
                //     'es-ES': 'test'
                // })
        )
        // ? leave
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('leave')
                .setDescription('Leave and abandon the house you are currently in')
        )
        // ? rank
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('rank')
                .setDescription('List all Houses by ranking and show stats')
        )
        // ? view (id)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('view')
                .setDescription('Display information about your house or another')
                // ? id
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('id')
                        .setDescription('The ID of the house to join')
                        .setAutocomplete(true)
                )
        )
        // ? create [name] [description] (motto) (invite_only) (banner_url) (banner_file)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('create')
                .setDescription('Create your own house (edits can be made later)')
                //  ? name
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('name')
                        .setDescription('Super cool house name of your choice')
                        .setRequired(true)
                )
                // ? description
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('description')
                        .setDescription('Brief description about your House for others to analyze')
                        .setRequired(true)
                )
                // ? motto
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('motto')
                        .setDescription('Outshine other houses with a unique House motto (optional)')
                )
                // ? invite_only
                .addBooleanOption(
                    new SlashCommandBooleanOption()
                        .setName('invite_only')
                        .setDescription('Require others to join via an invite? (optional)')
                )
                // ? banner_url
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('banner_url')
                        .setDescription('Link to an image or gif (optional)')
                )
                // ? banner_file
                .addAttachmentOption(
                    new SlashCommandAttachmentOption()
                        .setName('banner_file')
                        .setDescription('Upload image or gif to use (optional)')
                )
        )
        // ? kick [member] (reason)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('kick')
                .setDescription('Kick a member from your House')
                //  ? member
                .addUserOption(
                    new SlashCommandUserOption()
                        .setName('member')
                        .setDescription('Member to kick from the house')
                        .setRequired(true)
                )
                // ? reason
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('reason')
                        .setDescription('Reason why they got kicked (optional)')
                )
        )
        // ? invite [member] (message)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('invite')
                .setDescription('Invite a member to your House')
                // ? member
                .addUserOption(
                    new SlashCommandUserOption()
                        .setName('member')
                        .setDescription('Will send a DM invite to this member')
                        .setRequired(true)
                )
                // ? message
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('message')
                        .setDescription('Message to send the invite with (optional)')
                )
        )
        // ? edit (name) (description) (motto) (invite_only) (banner_url) (banner_file) 
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('edit')
                .setDescription('Send a member an invite to your House')
                // ? name
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('name')
                        .setDescription('A new name for the House')
                )
                // ? description
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('description')
                        .setDescription('A new description for the House')
                )
                // ? motto
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('motto')
                        .setDescription('A new motto for the House')
                )
                // ? invite_only
                .addBooleanOption(
                    new SlashCommandBooleanOption()
                        .setName('invite_only')
                        .setDescription('Set your house to invite only?')
                )
                // ? banner_url
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('banner_url')
                        .setDescription('A new url image or gif to use as a banner')
                )
                // ? banner_file
                .addAttachmentOption(
                    new SlashCommandAttachmentOption()
                        .setName('banner_file')
                        .setDescription('A new image or gif to use as a banner')
                )
        )
    ,

    // ? Interaction Handler
	async interact(interaction)
    {
        const { options } = interaction;

        if(!(await Houses.getNames()).length)
        {
            return `🔍 No houses are available. Be the first to create one, hurry! \`/house create\``;
        }

        if(options.getString('id'))
        {
            const house = await Houses.fetch(options.getString('id'));

            if(!house)
            {
                return `❔ That House does not exist, please try one of the following options: \`${(await Houses.getNames()).join('\`, \`')}\``;
            }

            interaction.house = house;
        }

        return this[options.getSubcommand()](interaction);
    },

    // ? Button Handler
    async buttonPress(interaction)
    {
        const { customId, member, message } = interaction;
        const house = await Houses.fetch(customId.split(':')[2].replace(/_+/g, ' '), 'members, name')
        const embed = new EmbedBuilder()
            .setAuthor({ name: '🏠 Houses | Invite' })
            .setThumbnail(house.banner)

        switch (customId.split(':')[1]) 
        {
            case 'acc':{
                const status = await Houses.edit(house, [...house.members, member.id]);
                if(!status) return oopsErr;
                await interaction.update({ embeds: [embed.setDescription(`Invite to ${house.name} accepted`).setColor(Colors.Green)], components: [] } );
                setTimeout(message.delete, 5000);
                break
            }

            case 'rej':{
                await interaction.update({ embeds: [embed.setDescription(`Invite to ${house.name} rejected`).setColor(Colors.Red)], components: [] } );
                setTimeout(message.delete, 5000);
                break
            }

            case 'join':{
                const inHouse = await Houses.find(({ members }) => members.includes(member.id));
                
                // ? Leave the current house
                if(inHouse)
                {
                    const status = await Houses.edit(inHouse, 'members', inHouse.members.filter(v => v !== member.id));
                    if(!status) return oopsErr;
                }

                interaction.house = house;

                return { content: await this.join(interaction), ephemeral: true };
            }
        }
    },

    async join({ member, house })
    {
        if(house.owner === member.id)
        {
            return `🏠 You can't join a House that you own!`;
        }

        if(house.members.includes(member.id))
        {
            return `🚪 Woops! Looks like you are already in that House.`;
        }

        if(house.invite_only)
        {
            return `🧧 Oops! Looks like this House is set to invite only. Only <@${house.owner}> can let you in.`;
        }

        const status = await Houses.edit(house, 'members', [...house.members, member.id]);
        
        if(!status) return oopsErr;

        return this.getJoinMessage(house);
    },

    async leave({ member })
    {
        const house = await Houses.find(({ members }) => members.includes(member.id));

        if(!house)
        {
            return `🏚️ You cant leave a House without being in one!`;
        }

        const status = await Houses.edit(house, 'members', house.members.filter(v => v !== member.id));

        if(!status) return oopsErr;

        // TODO Untested, should work fine tho
        const other = (await Houses.getNames()).filter(v => v != house.name).join('`, `');

        const name = `**${house.name}**`;

        return [
            `🏠 Adios! You have left ${name}. 👋`,
            `🚪 Salut! You have left ${name}. 👋`,
            `🏠 Goodbye! You have left ${name}. 👋`,
            `🚪 Farewell! You have left ${name}. 👋`,
            `🏠 You have left ${name}. What house will you join next?`,
            `🚪 You have left ${name}. What house will you join next?`,
        ][Math.floor(Math.random() * 5)] + (other.length? `\n\nHere are some other houses to choose from: \`${other}\`` : '');
    },

    async create({ options, member })
    {
        const own = await Houses.find(({ owner }) => owner === member.id, 'owner, name');

        if(own)
        {
            return `⛔ Hold your horses! You aleady own **${own.name}** and cannot create more Houses.`;
        }

        const inn = await Houses.find(({ members }) => members.includes(member.id), 'members, name');
        if(inn)
        {
            return `🏠 Failed to create. You are already in **${inn.name}**.`;
        }

        const name = options.getString('name');
        const description = options.getString('description');
        const motto = options.getString('motto') || '';
        const invite_only = options.getBoolean('invite_only') || false;
        const banner = options.getString('banner_url') || options.getAttachment('banner_file') || '';

        // TODO Check if exists: https://cdn.discordapp.com/ephemeral-attachments/1026842920436895774/1027074220863279124/huacarapona_palm_tree.png

        const status = await Houses.create({ name, description, motto, invite_only, banner, owner: member.id });

        if(!status) return oopsErr;

        return `🏘️ Success! Your house **${name}** has been created. 🎉`;
    },

    async kick({ options, member })
    {
        const house = await Houses.find(({ owner }) => owner === member.id, 'members, name, banner, owner');

        if(!house)
        {
            return `❌ You do not own a House.`;
        }

        const target = options.getMember('member');
        
        if(!house.members.includes(target.id))
        {
            return `❌ Member **${target}** is not in your House.`;
        }

        const status = await Houses.edit(house, 'members', house.members.filter(v => v !== target.id));

        if(!status) return oopsErr;
        
        const reason = options.getString('reason') || 'unspecified';
        const dm = await target.user.createDM();
        const available = await Houses.findAll(({ name }) => name !== house.name, 'name');

        dm.send({ embeds: [ new EmbedBuilder()
            .setAuthor({ 
                name: '🏠 Houses | Notice'
            })
            .setImage(house.banner)
            .setColor(Colors.Yellow)
            .setTitle(`You have been kicked from ${house.name}`)
            .setDescription(`
            *Reason: \`${reason}\`*

            For more info, please contact House owner <@${house.owner}> or re-join some other time.

            ${available.length? `🏘️ Here are some other Houses available at the current time.\n${available.map(v => `▸ ${v.name}`).join('\n')}` : ''}
            `)
        ] }).catch(err => {});

        return `✅ Successfully kicked **${target}** from your House.`;
    },

    async invite({ options, member })
    {
        const house = await Houses.find(({ owner }) => owner === member.id, 'members, name, banner, owner');

        if(!house)
        {
            return `❌ You do not own a House.`;
        }

        const target = options.getMember('member');

        if(target.id === member.id)
        {
            return `❌ You cannot invite yourself!`;
        }

        if(target.user.bot)
        {
            return `❌ You cannot invite <@${target.user.id}>, they're a bot!`;
        }

        const message = options.getString('message') || '';
        const dm = await target.user.createDM();

        try {

            dm.send({ 
                embeds: [ 
                    new EmbedBuilder()
                        .setAuthor({ 
                            name: '🏠 Houses | Invite'
                        })
                        .setImage(house.banner)
                        .setColor(Colors.Green)
                        .setTitle(`📨 You have been invited to ${house.name}!`)
                        .setDescription(`
                            ** **
    Mighty House owner <@${house.owner}> has personally sent this to you.
    
            ${message}
                        `)
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Accept Invite')
                                .setCustomId(`house:acc:${house.name.replace(/ +/g, '_')}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setLabel('Reject Invite')
                                .setCustomId(`house:rej:${house.name.replace(/ +/g, '_')}`)
                                .setStyle(ButtonStyle.Danger),
                        )
                ] 
            });

        } catch (error) {
            return `⛔ Failed to send invite to <@${target.id}>.\nMember might have server direct DMs disabled.`;
        }

        return `✅ Successfully sent an invite to <@${target.id}>. 📨`;
    },

    // TODO /edit (name) (description) (motto) (invite_only) (banner_url) (banner_file) 
    async edit({ options })
    {
        return null;
    },

    // TODO /rank
    async rank({ options })
    {
        return null;
    },

    // TODO /view (id)
    async view({ options, member })
    {
        if(options.getString('id'))
        {
            const house = await Houses.fetch(options.getString('id'));

            if(!house)
            {
                return `❔ That House does not exist, please try one of the following options: \`${(await Houses.getNames()).join('\`, \`')}\``;
            }

            // TODO Figure out how to not return and empheral response
            return { 
                // ephemeral: false, // ? This doesn't work
                embeds : [ 
                    new EmbedBuilder()
                        .setAuthor({
                            name: house.name,
                            iconURL: house.banner
                        })
                        .addFields([
                            {
                                name: `Xp`,
                                value: `‹\`${house.xp}\`›`,
                                inline: true
                            },
                            {
                                name: `Members`,
                                value: `‹\`${house.members.length}\`›`,
                                inline: true
                            },
                            {
                                name: `Rank`,
                                value: `‹\`1\`›`, // TODO This
                                inline: true
                            },
                            {
                                name: `Owner`,
                                value: `<@${house.owner}>`
                            }
                        ])
                        .setImage(house.banner)
                        .setDescription(`
ㅤ
ㅤㅤ${house.description}

ㅤㅤ*“${house.motto}”*
ㅤ
`)
                        .setFooter({
                            text: `/house view ${house.name}`,
                        })
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Join House')
                                .setCustomId(`house:join:${house.name.replace(/ +/g, '_')}`)
                                .setStyle(ButtonStyle.Primary),
                        )
                ] 
            };
        }


        return null;
    },

    // ? Utility commands

    async getJoinMessage({ name })
    {
        name = `**${name}**`;
        return [
            `🚪 Hurray! You are now a part of ${name}. 🎉`,
            `🏠 Marvelous! You have joined ${name}. 🎊`,
            `🚪 The door has opened to you. You have joined ${name}!`,
            `🏠 The path to ${name} has been uncovered.. You have joined the House! 🎊`,
            `🚪 Hurrah! You are now contained within ${name}! 🎉`,
        ][Math.floor(Math.random() * 5)];
    }
};