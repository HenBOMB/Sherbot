const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { DisableButton } = require("../../../tools/utils.js");
const https = require('https');
const DailyTips = require('../../features/dailytips.js')

var enabled;
var client;
var collector;

module.exports =
{
    commands:['dailytips', 'dts'],

    role: '679795909143429123',

	execute : async function(message, embed, args) 
    {
        if(args.length > 1)
        {
            page = parseInt(args[1])
            tipIndex = parseInt(args[2])

            switch(args[0]){
                case 'preview':
                    await new Promise(resolve => {
                        https.get('https://aguidetodeduction.tumblr.com/tagged/A+Guide+to+Deduction/page/' + (178 - page), (resp) => 
                        {
                            let data = "";
                
                            resp.on('data', (chunk) =>
                            {
                                data += chunk;
                            })
                
                            resp.on('end', () => 
                            {
                                data = data.slice(data.indexOf(`post"`) + 5)
                                let imgUrls = []
            
                                while (data.includes("_500")) 
                                {
                                    let index = data.indexOf(`_500`)
            
                                    let url = data.slice(index-80, index+8)
            
                                    url = url.slice(url.indexOf("c=") + 3)
            
                                    data = data.slice(index + 20)
            
                                    imgUrls.push(url)
                                }
            
                                let image = imgUrls[imgUrls.length - tipIndex - 1];
            
                                tipIndex+=1;
            
                                if(tipIndex == imgUrls.length)
                                {
                                    tipIndex = 0;
                                    page+=1;
                                }
                            
                                embed.setImage(image)
                                .setDescription("<@&740693917514727431>")
                                
                                message.channel.send({ embeds: [embed] })
                                resolve();
                            })
            
                            resp.on('error', () => {
                                console.log(error);
                                resolve();
                            });
                        })
                    })
                    break;
                case 'run':
                    DailyTips.dailyTip(page, tipIndex)
                    break;
            }
                
            return;
        }
        
        message.channel.send('Command Obsolete.')

        return;

        const row = new MessageActionRow()
        .addComponents(
			new MessageButton()
				.setCustomId('dt:start')
				.setLabel('Enable')
				.setStyle('SUCCESS')
                .setDisabled(enabled),
            new MessageButton()
				.setCustomId('dt:stop')
				.setLabel('Disable')
				.setStyle('DANGER')
                .setDisabled(!enabled),
		)

        message.channel.send({ content: "**Daily Tips**", components: [row]}).then(message => {

            const filter = i => i.customId.includes('dt:');
            
            if(collector != undefined)
                collector.stop();
    
            collector = message.channel.createMessageComponentCollector({ filter, time: 6000 });
    
            DisableButton(message, collector, message.content);

            collector.on('collect', i => {
                
                enabled = !enabled;
                
                client.features.get("dailytips").execute();

                row.components[0].setDisabled(enabled);
                row.components[1].setDisabled(!enabled);
    
                i.update({ components: [row] })
    
                collector.resetTimer();
            });
        })
    },

    initialize : async function(cl, con, data)
    {
        client = cl;
        enabled = data.dt_active == 1? true : false;
    },
};