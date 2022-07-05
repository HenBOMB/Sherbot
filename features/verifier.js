const { MessageEmbed } = require("discord.js");

var enabled;
var connection;

module.exports =
{
    initialize : function(guild, con, data)
    {
        enabled = data.verif_on == 1? true : false;
        verifyChannel = guild.channels.cache.get('906149558801813605');
        warnChannel = guild.channels.cache.get('718576277329674361');
        connection = con;
    },
    
    execute : function(embed)
    {
        enabled = !enabled;

        connection.query(`UPDATE sherbot SET verif_on = ${enabled} WHERE id = 670107546480017409`,
        (err) => {
            if(err) 
            {
                verifyChannel.guild.channels.get('718576277329674361').send({ content: "@HenBOMB.#0274\n**Failed to update data on `verifier.js`** (verif_on)" })
                return;
            }

            console.log("update: verif_on (verifier.js)")
        });
    },

    tick : async function(message)
    {
        if(!enabled || message.member == null) 
            return;

        if(message.channel.id != verifyChannel) 
            return;

        if(message.member.roles.cache.has('906128248193306635'))
            return;

        let content = message.content.toLowerCase();

        content = content.replace("Have you read the rules?".toLowerCase(), "");
        content = content.replace("Why are you interested in deduction? ".toLowerCase(), "");
        content = content.replace("How long have you been practicing deduction?".toLowerCase(), "");
        content = content.replace("What is your favorite field of study?".toLowerCase(), "");
        content = content.replace("What is your purpose of joining this server?".toLowerCase(), "");

        const words = content.match(/[a-zA-Z]+/g).length;
        const characters = content.match(/[a-zA-Z]/g).length;

        if(words < 15 || characters < 40)
            return;

        const embed = new MessageEmbed();

        // if(characters < 50)
        // {
        //     embed.setDescription(`[**User ${message.author} requires human verification :warning: **](${message.url})`)
        //     .setColor("ffcc00");
        //     return warnChannel.send({ content: "<@&679795909143429123>", embeds: [embed]});
        // }

        let score = 0;

        const lines = content.split('\n').length;

        // Positives

        if(words > 80 && characters > 300) score += 3;

        if(content.includes("deduce") 
        || content.includes("deduction")) score += 1;

        if(content.includes("holmes") 
        || content.includes("sherlock")) score += 1;

        if(content.includes("practic") 
        || content.includes("learn")
        || content.includes("skill")) score += 1;

        if(content.includes("psychology") 
        || content.includes("biology") 
        || content.includes("science") 
        || content.includes("human") 
        || content.includes("math")) score += 1;

        if(content.includes("month")) score += 1;

        if(characters / words > 4.3) 
            score += 3;

        if(content.includes("1.")
        || content.includes("2.")
        || content.includes("3.")
        || content.includes("4.")
        || content.includes("5.")) score += 1;
        else
            score /= 2;

        // Negatives

        if(characters < 100) score -= 2;

        if(words < 35) score -= 2;

        if(characters / words < 4) 
            score -= 5;
        
        if(characters / words > 6.5) 
            score -= 5;

        if(lines < 5)
            score -= (5 - lines) + 1;

        if(score > 1)
        {
            await message.react('✅');
            await message.member.roles.add('906128248193306635');
            await message.member.roles.add('670108333834764288');

            embed.setDescription(`[**User ${message.author} has been auto-verified :white_check_mark:**](${message.url})`)
            .setColor("4BB543");
            await warnChannel.send({ embeds: [embed]})
        }
        else
        {
            embed.setDescription(`[**User ${message.author} requires human verification :warning: **](${message.url})`)
            .setColor("e50000");
            warnChannel.send({ content: "<@&679795909143429123>", embeds: [embed]})
        }
    },
};