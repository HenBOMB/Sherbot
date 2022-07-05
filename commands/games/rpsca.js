// Rock Paper Scissors Cellular Automata

const { MessageActionRow, MessageButton } = require('discord.js');
const { DisableButton } = require("../../../tools/utils.js")
const { RandomNumber } = require("../../../tools/random.js")

const options = {
    "rock" : 
    {
        "e" : "🪨",
        "k" : ["lizard", "scissors"],
        "w" : ["paper", "spock"],
        "m" : {
            "lizard" : "smashes",
            "scissors" : "smashes"
        },
        "t" : "smashed"
    },
    "paper" : 
    {
        "e" : "🧻",
        "k" : ["rock", "spock"],
        "w" : ["scissors", "lizard"],
        "m" : {
            "rock" : "covers",
            "spock" : "dissaproves"
        },
        "t" : "covered"
    },
    "scissors" : 
    {
        "e" : "✂️",
        "k" : ["lizard", "paper"],
        "w" : ["rock", "spock"],
        "m" : {
            "lizard" : "decipates",
            "paper" : "cuts"
        },
        "t" : "cut"
    },
    "lizard" : 
    {
        "e" : "🦎",
        "k" : ["spock", "paper"],
        "w" : ["rock", "scissors"],
        "m" : {
            "spock" : "poisons",
            "paper" : "eats"
        },
        "t" : "ate"
    },
    "spock" : 
    {
        "e" : "🖖",
        "k" : ["rock", "scissors"],
        "w" : ["lizard", "paper"],
        "m" : {
            "rock" : "vaporizes",
            "scissors" : "smashes"
        },
        "t" : "vaporized"
    }
}

var cache = {};

module.exports =
{
    flags:["mention"],

    commands:['rpsca'],

    execute : async function(message, embed, mention) 
    {
        return;
        
        let uid = RandomNumber(1000);
        while(uid in cache)
            uid = RandomNumber(1000);
        
        const p1 = message.member.displayName;
        const p2 = mention.displayName;

        cache[uid] = { i : mention.user.bot? 1 : 0 }
        cache[uid]["attacker"] = message.member.id;
        cache[uid]["defender"] = mention.id;
        cache[uid]["attackerdn"] = message.member.displayName;
        cache[uid]["defenderdn"] = mention.displayName;
        cache[uid][message.member.id] = '';
        cache[uid][mention.id] = '';

        const row = new MessageActionRow()
        .addComponents(
			new MessageButton()
				.setCustomId('rpsca:'+uid+':rock')
				.setLabel('Rock')
				.setStyle('PRIMARY')
                .setEmoji('🪨'),
            new MessageButton()
				.setCustomId('rpsca:'+uid+':paper')
				.setLabel('Paper')
				.setStyle('PRIMARY')
                .setEmoji('🧻'),
            new MessageButton()
				.setCustomId('rpsca:'+uid+':scissors')
				.setLabel('Scissors')
				.setStyle('PRIMARY')
                .setEmoji('✂️'),
            new MessageButton()
				.setCustomId('rpsca:'+uid+':lizard')
				.setLabel('Lizard')
				.setStyle('PRIMARY')
                .setEmoji('🦎'),
            new MessageButton()
				.setCustomId('rpsca:'+uid+':spock')
				.setLabel('Spock')
				.setStyle('PRIMARY')
                .setEmoji('🖖'),
		);
        
        let text = `**${p1} vs ${p2}**\n${p1} is choosing...\n${p2}`;
        text += mention.user.bot? " is ready!" : " is choosing...";

        message.channel.send({ content: text, components: [row]})
        .then(newMessage => {

            const filter = i => 
                i.customId.includes('rpsca:') 
                && (i.user.id === message.member.id || i.user.id ===  mention.id)
                && i.customId.includes(uid);
        
            const collector = newMessage.channel.createMessageComponentCollector({ filter, time: 20000 });
                
            new DisableButton(newMessage, collector, `**${p1} vs ${p2}**\nTook too long to choose.`);

            collector.on('collect', async i => {
                //rpsca:uid:type
                uid = i.customId.slice(6, i.customId.slice(6).indexOf(":")+6);

                const type = i.customId.slice(i.customId.slice(10).indexOf(":")+11);

                cache[uid][i.member.id] = type;
                cache[uid].i += 1;

                const attacker = cache[uid][cache[uid].attacker];
                let defender = cache[uid][cache[uid].defender];

                if(cache[uid].i !== 2)
                {
                    collector.resetTimer();

                    let text = `**${p1} vs ${p2}**\n`;

                    if(cache[uid][cache[uid].attacker] != '')
                        text += cache[uid].attackerdn + " is ready!\n";
                    else
                        text += cache[uid].attackerdn + " is choosing...\n";

                    if(cache[uid][cache[uid].defender] != '')
                        text += cache[uid].defenderdn + " is ready!\n";
                    else
                        text += cache[uid].defenderdn + " is choosing...\n";

                    await i.update({ content : text, components: [row] });

                    return;
                }

                // if is bot?
                if(defender === '')
                {
                    if(mention.id === '712429527321542777')
                    {
                        defender = options[attacker].w[[Math.random() > 0.5? 0 : 1]];
                    }
                    else
                    {
                        defender = ["rock", "paper", "scissors", "lizard", "spock"][Math.floor(Math.random() * 5)];
                    }
                }

                row.components.forEach(item => {
                    item.setDisabled(true)
                });

                let text = `**${p1} vs ${p2}**\n`;

                if(defender === attacker)
                    // text += `${p1} chose ${options[attacker].e}! \n${p2} chose ${options[defender].e} and tied!`;
                    text += `${p1} (${options[attacker].e}) and ${p2} (${options[defender].e}) ${options[attacker].t} eachother and tied!`;
                else if(options[attacker].k.includes(defender))
                    text += `${p1} (${options[attacker].e}) ${options[attacker].m[defender]} ${p2} (${options[defender].e}) and wins!!`;
                else
                    text += `${p2} (${options[defender].e}) ${options[defender].m[attacker]} ${p1} (${options[attacker].e}) and wins!!`;

                await i.update({ content : text, components: [row] });

                delete cache[uid];

                collector.stop();
            });
        })
    },

    initialize : async function(client, con, data)
    {
        
    }
}