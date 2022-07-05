const { MessageActionRow, MessageButton } = require('discord.js');
const { DisableButton } = require("../../../tools/utils.js");

var enabled;
var client;
var collector;

module.exports =
{
    flags:["noargs"],

    commands:['verifier'],
    
    role: '679795909143429123',

	execute : async function(message, embed) 
    {
        const row = new MessageActionRow()
        .addComponents(
			new MessageButton()
				.setCustomId('ide:start')
				.setLabel('Enable')
				.setStyle('SUCCESS')
                .setDisabled(enabled),
            new MessageButton()
				.setCustomId('ide:stop')
				.setLabel('Disable')
				.setStyle('DANGER')
                .setDisabled(!enabled),
		)

        message.channel.send({ content: "**Auto Verifier ✅**", components: [row]}).then(message => {

            const filter = i => i.customId.includes('ide:');
    
            if(collector != undefined)
                collector.stop();

            collector = message.channel.createMessageComponentCollector({ filter, time: 6000 });
    
            DisableButton(message, collector, message.content);

            collector.on('collect', i => {
                
                enabled = !enabled;
                
                client.features.get("verifier").execute();

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
        enabled = data.verif_active == 1? true : false;
    },
};