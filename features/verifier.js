const { Colors, EmbedBuilder } = require('discord.js');

const verifiedRole = '906128248193306635';
const verifiedChannel = '906149558801813605';

module.exports = {

    async sendWelcome(member, guild)
    {
		const channel = await member.user.createDM();
		const embed = new EmbedBuilder()
            .setAuthor({ name: 'Successfully Verified' })
			.setTitle(`🎉 Welcome to the server ${member.user.username}! 🎉`)
			.setThumbnail(member.displayAvatarURL())
			.setDescription(`
ㅤ
*We're glad to have you 💖*

Say hi :wave:
• <#670111155263635476>

Introduce yourself
• <#670108903224377354>

Some channels you might be interested in
• <#678996795686256641>
• <#679769341058744379>
• <#679781702838910986>
• <#714701731724001311>
`)
			.setImage('https://media.discordapp.net/attachments/1018969696445403217/1026395223028404324/unknown.png')
			.setFooter({ text: guild.name })
			.setTimestamp();
		return await channel.send({ embeds: [embed] });
    },

    async verify(message)
    {
        await message.react('✅');
        await message.member.roles.add(verifiedRole);
        this.sendWelcome(message.member, message.guild);
        process.log('Verified', `✅ [Auto verified ${message.member}](${message.url})`, Colors.Green);
    },

    async initialize(client)
    {
        client.on('messageReactionAdd', async ({ message, emoji }, user) => {
            if(user.bot) return;
            if(emoji.name !== '✅') return;
            if(message.channel.id !== verifiedChannel) return;
            message = await message.fetch();
            const member = await message.guild.members.fetch(message.author.id);
            if(member.roles.cache.has(verifiedRole)) return;
            member.roles.add(verifiedRole);
            this.sendWelcome(member, message.guild);
        });
    },

    async tick(message)
    {
        if(message.member == null) return;
        if(message.channel.id != verifiedChannel) return;
        if(message.member.roles.cache.has(verifiedRole)) return;

        let content = message.content.toLowerCase();

        if(content.includes("have you read the rules?") ) score += 4;

        content = content.replace("have you read the rules?", "");
        content = content.replace("why are you interested in deduction? ", "");
        content = content.replace("how long have you been practicing deduction?", "");
        content = content.replace("what is your favorite field of study?", "");
        content = content.replace("what is your purpose of joining this server?", "");

        const words = content.match(/[a-zA-Z]+/g).length;
        const characters = content.match(/[a-zA-Z]/g).length;

        if(words < 15 || characters < 40)
            return;

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
        || content.includes("5."))
            return this.verify(message);
        else
            score -= 2;

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
            await this.verify(message);
        }
    },
};