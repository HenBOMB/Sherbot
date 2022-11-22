const Houses = require("../scripts/houses");
const Member = require("../scripts/member");

// TODO track users x / day, use separate table
const deductionId = '852185049860276304';

module.exports = {
    tick({ author, channel, content })
    {
        Member.load(author.id).then(async member => {
            member.msg_me++;
    
            if(member.house)
            {
                const house = await Houses.fetch(member.house);
                house.xp += Math.ceil(Math.random() * 10) + 20;
                await house.save();
                
                member.msg_house++;
            }
    
            if(channel.parentId === deductionId && content.match(/(?<=\|\|).{25,}(?=\|\|)/gm))
            {
                member.msg_ded++;
            }
    
            await member.save();
        });
    },
};