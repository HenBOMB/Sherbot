const { EmbedBuilder, Colors } = require('discord.js');

const House = require("../scripts/house");
const Member = require("../scripts/member");
const CLI = require("../scripts/_cli");

//?house [name, join, leave] (name) --{name, motto, create, delete, view, color, banner}

module.exports =
{
    defer: true,
    
    guildid: '643440133881856019',

    description: "House utility commands.",

    options: [
        {
            type: 1,
            name: "join",
            description: "Join and be part of a server House!",
            options: [
                {
                    type: 3,
                    name: "id",
                    description: "The ID of the house to join (/house list)",
                    required: true
                }
            ]
        },
        {
            type: 1,
            name: "leave",
            description: "Leave and abandon a house",
            options: [
                {
                    type: 3,
                    name: "id",
                    description: "The ID of the house to abandon (/house list)",
                    required: true
                }
            ]
        },
        {
            type: 1,
            name: "info",
            description: "Display information about your house or another",
            options: [
                {
                    type: 3,
                    name: "id",
                    description: "The ID of the house to view. (/house list) (optional)"
                }
            ]
        },
        {
            type: 1,
            name: "create",
            description: "Create your own house (settings can be changed later)",
            options: [
                {
                    type: 3,
                    name: "name",
                    description: "Super cool house name of your choice",
                    required: true
                },
                {
                    type: 3,
                    name: "description",
                    description: "Brief description about your House for others to judge",
                    required: true
                },
                {
                    type: 3,
                    name: "motto",
                    description: "Outshine other houses with a unique House motto (optional)"
                },
                {
                    type: 5,
                    name: "invite_only",
                    description: "Require others to join via an invite? (optional)"
                },
                {
                    type: 3,
                    name: "banner_url",
                    description: "A link to an image or gif (optional)"
                },
                {
                    type: 11,
                    name: "banner_file",
                    description: "An image or gif to use (optional)"
                }
            ]
        },
        {
            type: 1,
            name: "kick",
            description: "Kick a member from your House",
            options: [
                {
                    type: 6,
                    name: "member",
                    description: "Member to kick from the house",
                    required: true
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason why they got kicked (optional)"
                }
            ]
        },
        {
            type: 1,
            name: "ban",
            description: "Ban a member from your House",
            options: [
                {
                    type: 6,
                    name: "member",
                    description: "Member to kick from the house",
                    required: true
                },
                {
                    type: 3,
                    name: "reason",
                    description: "Reason why they got kicked (optional)"
                }
            ]
        },
        {
            type: 1,
            name: "invite",
            description: "Send a server member an invite to your House",
            options: [
                {
                    type: 6,
                    name: "member",
                    description: "Member to send the invite to",
                    required: true
                },
                {
                    type: 3,
                    name: "message",
                    description: "Message to send the invite with (optional)"
                }
            ]
        },
        {
            type: 1,
            name: "list",
            description: "List all the Houses available to join"
        },
        {
            type: 1,
            name: "edit",
            description: "House editing utility commands",
            options: [
                {
                    type: 3,
                    name: "name",
                    description: "A new name for the House",
                    required: true
                },
                {
                    type: 3,
                    name: "description",
                    description: "A new description for your House",
                },
                {
                    type: 3,
                    name: "motto",
                    description: "A new motto for your House",
                },
                {
                    type: 3,
                    name: "banner_url",
                    description: "A new url image or gif to use as a banner"
                },
                {
                    type: 11,
                    name: "banner_file",
                    description: "A new image or gif to use as a banner"
                },
                {
                    type: 5,
                    name: "invite_only",
                    description: "Set your house to invite only?",
                }
            ]
        }
    ],

	interact : async function ({ channel, options })
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