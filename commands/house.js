const { 
    EmbedBuilder, Colors, 
    SlashCommandBuilder, 
    SlashCommandSubcommandBuilder, 
    SlashCommandStringOption, 
    SlashCommandBooleanOption, 
    SlashCommandAttachmentOption,
    SlashCommandUserOption
} = require('discord.js');

const Member = require("../scripts/member");

//?house [name, join, leave] (name) --{name, motto, create, delete, view, color, banner}

module.exports =
{
    defer: true,
    
    guildId: '643440133881856019',

    data: new SlashCommandBuilder()
        .setName('house')
        .setDescription('House utility commands.')
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
        // ? info (id)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('info')
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
        // ? ban [member] (reason)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('ban')
                .setDescription('Ban a member from your House')
                //  ? member
                .addUserOption(
                    new SlashCommandUserOption()
                        .setName('member')
                        .setDescription('Member to ban from the house')
                        .setRequired(true)
                )
                // ? reason
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName('reason')
                        .setDescription('Reason why they got banned (optional)')
                )
        )
        // ? invite [member] (message)
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('invite')
                .setDescription('Send a member an invite to your House')
                // ? member
                .addUserOption(
                    new SlashCommandUserOption()
                        .setName('member')
                        .setDescription('Member to send the invite to')
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

	interact ({ channel, options })
    {
        const command = options.getSubcommand();
    },
    
	_interact : async function (message, embed, _args, cmd) 
    {
        const send = (color, desc) => {
            return message.channel.send({ embeds: [new EmbedBuilder().setColor(color).setDescription(desc)] });
        }
        
        if(cmd === 'houses')
        {
            process.conn.query(`SELECT * FROM houses`, (err, res) => 
            {
                const list = [];
                res.forEach(v => list.push(v.name));
                return send(Colors.Green, `These are the available houses:\n\`${list.join(' ')}\``);
            });
            
            return;
        }

        if(_args.length == 0)
        {
            return send(Colors.Red, 'Missing required arguments');
        }

        // * Basic command args

        const member = await Member.load(message.author.id);

        switch (_args[0]) 
        {
            case 'join':
                if(!_args[1])
                {
                    return send(Colors.Red, 'Missing argument, house not specified. Usage below\n`?house [join/leave] [housename]`');
                }

                if(await new Promise(resolve => {
                    process.conn.query(`SELECT * FROM houses`, (err, res) => 
                    {
                        if(_args[1] === res.name) return resolve(false);
                        for (let i = 0; i < res.length; i++) 
                            if(_args[1].toLowerCase() === res[i].name.toLowerCase())
                                return resolve(false);
                        resolve(true);
                    });
                }))
                {
                    return send(Colors.Red, `House with the name \`${_args[1]}\` does not exist`);
                }

                if(member.house === _args[1])
                {
                    return send(Colors.Red, `You are already in that house!`);
                }

                member.house = _args[1];
                member.save();
                
                return send(Colors.Green, `You have joined the \`${_args[1]}\` house!`);

            case 'leave':
                if(!member.house)
                {
                    process.conn.query(`SELECT * FROM houses`, (err, res) => 
                    {
                        let list = "";
                        for (let i = 0; !res.name && i < res.length; i++) 
                            list += res[i].name.toLowerCase() + ', ';
                        list = list.slice(0, list.length-2);
                        list += res.name || "";

                        return send(Colors.Yellow, `You are currently not in any house. These are the available houses:\n\`${list}\``);
                    });
                    return;
                }
                send(Colors.Yellow, `You have left the \`${member.house}\` house!`);
                member.house = null;
                member.save();
                return;
        }

        // * CLI

        const house_name = _args[0];
        
        var house = await new Promise(resolve => {
            process.conn.query(`SELECT * FROM houses`, (err, res) => 
            {
                for (let i = 0; i < res.length; i++)
                    if(house_name === res[i].name)
                        return resolve(new House(res[i]));
                resolve(null);
            });
        })

        const cli = new CLI();

        cli.add('view', 'House preview', () => {
            if(!house) return false;
            let _embed = new EmbedBuilder()
                .setColor(house.color.length > 0? house.color : Colors.Orange)
                .setTitle(house.name.slice(0,1).toUpperCase() + house.name.slice(1).toLowerCase())
                .setDescription(`${house.motto}`)
                .setThumbnail(house.banner.length > 0? house.banner : 'https://cdn.discordapp.com/attachments/1018969696445403217/1018969756709171250/missingimage.png')
            message.channel.send({ embeds: [_embed] });
        })
        .add('create', 'House created', () => {
            if(house) return false;
            house = House.create(house_name);
        })
        .add('delete', 'House deleted', () => {
            if(!house) return false;
            House.delete(house_name);
        })
        .add('name', 'House renamed', (input) => {
            if(!house) return false;
            house.name = input || house.name;
        })
        .add('motto', 'House motto updated', (input) => {
            if(!house) return false;
            house.motto = input || house.motto;
        })
        .add('banner', 'House banner updated', (input) => {
            if(!house) return false;
            house.banner = input || house.banner;
        })
        .add('color', 'House color updated', (input) => {
            if(!house) return false;
            house.color = input || house.color;
        })
        .execute(message.content);
        
        if(!house) 
        {
            return send(Colors.Red, 'House does not exist, no changes were made');
        }

        if(cli.logs.length > 0)
        {
            await house.save();
            cli.log();
        }
    },
};