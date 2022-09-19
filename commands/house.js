const { EmbedBuilder, Colors } = require('discord.js');

const House = require("../scripts/house");
const Member = require("../scripts/member");
const CLI = require("../scripts/cli");

//?house [name, join, leave] (name) --{name, motto, create, delete, view, color, banner}

module.exports =
{
    commands: ['house', 'houses'],

	execute : async function (message, embed, _args, cmd) 
    {
        const send = (color, desc) => {
            return message.channel.send({ embeds: [new EmbedBuilder().setColor(color).setDescription(desc)] });
        }
        
        if(cmd === 'houses')
        {
            process.env.conn.query(`SELECT * FROM houses`, (err, res) => 
            {
                const list = [];
                res.forEach(v => list.push(v.name));
                return send('GREEN', `These are the available houses:\n\`${list.join(' ')}\``);
            });
            
            return;
        }

        if(_args.length == 0)
        {
            return send('RED', 'Missing required arguments');
        }

        // * Basic command args

        const member = await Member.load(message.author.id);

        switch (_args[0]) 
        {
            case 'join':
                if(!_args[1])
                {
                    return send('RED', 'Missing argument, house not specified. Usage below\n`?house [join/leave] [housename]`');
                }

                if(await new Promise(resolve => {
                    process.env.conn.query(`SELECT * FROM houses`, (err, res) => 
                    {
                        if(_args[1] === res.name) return resolve(false);
                        for (let i = 0; i < res.length; i++) 
                            if(_args[1].toLowerCase() === res[i].name.toLowerCase())
                                return resolve(false);
                        resolve(true);
                    });
                }))
                {
                    return send('RED', `House with the name \`${_args[1]}\` does not exist`);
                }

                if(member.house === _args[1])
                {
                    return send('RED', `You are already in that house!`);
                }

                member.house = _args[1];
                member.save();
                
                return send('GREEN', `You have joined the \`${_args[1]}\` house!`);

            case 'leave':
                if(!member.house)
                {
                    process.env.conn.query(`SELECT * FROM houses`, (err, res) => 
                    {
                        let list = "";
                        for (let i = 0; !res.name && i < res.length; i++) 
                            list += res[i].name.toLowerCase() + ', ';
                        list = list.slice(0, list.length-2);
                        list += res.name || "";

                        return send('YELLOW', `You are currently not in any house. These are the available houses:\n\`${list}\``);
                    });
                    return;
                }
                send('YELLOW', `You have left the \`${member.house}\` house!`);
                member.house = null;
                member.save();
                return;
        }

        // * CLI

        const house_name = _args[0];
        
        var house = await new Promise(resolve => {
            process.env.conn.query(`SELECT * FROM houses`, (err, res) => 
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
            return send('RED', 'House does not exist, no changes were made');
        }

        if(cli.logs.length > 0)
        {
            await house.save();
            cli.log();
        }
    },

    initialize : function(conn) { }
};