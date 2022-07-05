const Sherlock = require('../../sherlock/sherlock');
const { MessageActionRow, MessageButton } = require('discord.js');
const { DisableButton } = require("../../../tools/utils.js");

const sherlock = new Sherlock();

var scanners = [];

var scanResults = { };

module.exports =
{
    flags:["noargs"],

    commands:['sherlock'],

    ids: [process.env.ownerid, '852558365913382953'],
    
	execute : async function(message, embed) 
    {
        const target = message.content;

        if(target.includes(' '))
        {
            embed.setDescription(`Usernames with spaces not supported yet`);
            return message.channel.send({ embeds: [embed] });
        }

        if(target.length === 0)
        {
            embed
                .setTitle("Sherlock (JS)")
                .setDescription(
`Hunt down social media accounts by username across social networks.\n
usage: \`?sherlock [username]\`
repo: [not yet published on github]
`)
                .setFooter('Made by: HenBOMB.#0274')
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        if(scanners.includes(message.member.id))
        {
            embed.setDescription(`You are running or have scan results open, make sure to close that first.`);
            return message.channel.send({ embeds: [embed] });
        }

        scanners.push(message.member.id);

        //  //  //

        embed
            .setAuthor(`Searching for accounts from ${target} 🔍`)
            .setFooter(`Sherlock (JS) • This can take upto a minute. `)

        let sent = await message.channel.send({ embeds: [embed] });

        const now = new Date();

        const results = scanResults[target] != undefined? 
            scanResults[target] : 
            await sherlock.search(target);
        
        let took = now.getSeconds() - (new Date()).getSeconds();
        took = took < 0? 60 + (-took) : took;
        console.log("Took: " + took + "s")

        scanResults[target] = results;

        const pages = this.pagify(results);

        embed
            .setAuthor(`Found ${results.length} accounts`)
            .setDescription(pages[0])
            .setTimestamp()
            .setFooter(`Sherlock (JS) • Results are saved for 5 minutes`);

        //  //  //

        sent.delete();

        await (async () => {

            const _id = message.member.id;
            const _channel = message.channel;
            const _target = target;
            const _embed = embed;

            const filter = i => i.customId.includes('sh:');
            const collector = _channel.createMessageComponentCollector({ filter, time: 120000 });

            let row;
            let page = 0;
            let paginator = this.pagify(results);
            let shortened = false;

            setTimeout(() => {
                delete scanResults[_target];
            }, 300000);

            if(pages.length === 1)
            {
                row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('sh:s')
                        .setStyle('SECONDARY')
                        .setLabel('Shorten')
                        .setEmoji('🔻'),
                    new MessageButton()
                        .setCustomId('sh:c')
                        .setStyle('DANGER')
                        .setLabel('Close')
                        .setEmoji('❌'),
                );
            }
            else
            {
                row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('sh:p')
                        .setStyle('PRIMARY')
                        .setEmoji('◀️'),
                    new MessageButton()
                        .setCustomId('sh:n')
                        .setStyle('PRIMARY')
                        .setEmoji('▶️'),
                    new MessageButton()
                        .setCustomId('sh:s')
                        .setStyle('SECONDARY')
                        .setLabel('Shorten')
                        .setEmoji('🔻'),
                    new MessageButton()
                        .setCustomId('sh:c')
                        .setStyle('DANGER')
                        .setLabel('Close')
                        .setEmoji('❌'),
                );
            }

            const _message = await _channel.send({ embeds: [_embed], components: [row] })

            new DisableButton(_message, collector);

            collector.on('end', () => {
                if(scanners.indexOf(_id) != -1)
                    scanners.splice(scanners.indexOf(_id), 1);

                 _embed.author = "";

                if(!_embed.description.includes('closed by'))
                    _embed.setDescription(`**Auto closed results from \`${_target}\` 👁‍🗨**`)

                row.components.forEach(c => c.setDisabled(true));

                _message.edit({ embeds: [_embed], components: [row]  });
            })

            collector.on('collect', async interaction => {
                collector.resetTimer();
    
                switch(interaction.customId)
                {
                    case 'sh:p':
                        page--;

                        if(page <= 0)
                        {
                            page = 0;
                            row.components[0].setDisabled(true);
                            row.components[1].setDisabled(false);
                        }

                        _embed.setDescription(paginator[page]);
                        
                        break;
                    case 'sh:n':
                        page++;

                        if(page >= paginator.length - 1)
                        {
                            page = paginator.length - 1;
                            row.components[0].setDisabled(false);
                            row.components[1].setDisabled(true);
                        }   

                        _embed.setDescription(paginator[page]);
                        
                        break;
                    case 'sh:s':
                        shortened = !shortened;
                        row.components[pages.length === 1?0:2].setEmoji(shortened? '🔺' : '🔻');
                        row.components[pages.length === 1?0:2].setLabel(shortened? 'Expand' : 'Shorten')
                        paginator = this.pagify(scanResults[_target], shortened);
                        _embed.setDescription(paginator[page]);
                        
                        break;
                    default:
                        interaction.deferUpdate();
                        _embed.setDescription(`**Search results from \`${_target}\` closed by ${interaction.member}** 👁‍🗨`);
                        collector.stop();
                        return;
                }
    
                await interaction.update({ embeds: [_embed], components: [row] });
            });
        })();
    },

    initialize : async function(cl, con, data)
    {
        sherlock.loadData('./sherbot/sherlock/data.json');
    },

    pagify : function(results, short = false)
    {
        const pages = [""];
        let p = 0;

        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            const add = short? `[${res.title}](${res.url}), ` : `${res.title}\n➺ **[${res.url}](${res.url})**\n`;

            if(pages[p].length + add.length > 4096)
            {
                p++;
                pages.push("");
                continue;
            }

            pages[p] += add;
        }

        if(short)
            for (let i = 0; i < pages.length; i++)
                pages[i].slice(0,-2);

        return pages;
    }
};