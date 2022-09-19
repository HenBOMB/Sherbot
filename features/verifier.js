module.exports =
{
    initialize : function(guild, con, data) { },
    
    tick : async function(message)
    {
        if(message.member == null) 
            return;

        if(message.channel.id != '906149558801813605') 
            return;

        if(message.member.roles.cache.has('906128248193306635'))
            return;

        let content = message.content.toLowerCase();

        if(content.includes("Have you read the rules?") ) score += 2;

        if(content.includes("Why are you interested in deduction?")) score += 2;

        content = content.replace("Have you read the rules?".toLowerCase(), "");
        content = content.replace("Why are you interested in deduction? ".toLowerCase(), "");
        content = content.replace("How long have you been practicing deduction?".toLowerCase(), "");
        content = content.replace("What is your favorite field of study?".toLowerCase(), "");
        content = content.replace("What is your purpose of joining this server?".toLowerCase(), "");

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
        }
    },
};