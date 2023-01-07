const Houses = require("../scripts/houses");
const Member = require("../scripts/member");

// TODO track users x / day, use separate table
const deductionId = '852185049860276304';

module.exports = {
    tick({ author, channel, content, guild })
    {
        if(guild.id !== '670107546480017409') return;

        Member.load(author.id).then(async member => {
            member.count_me++;
            
            // console.log(`${author.username}: ${content}`);

            if(member.house)
            {
                const house = await Houses.fetch(member.house);
                house.xp += Math.ceil(Math.random() * 10) + 20;
                await house.save();
                
                member.count_house++;
            }
    
            if(channel.parentId === deductionId && content.match(/(?<=\|\|).{25,}(?=\|\|)/gm))
            {
                member.count_ded++;
            }
    
            await member.save();
        });
    },
};