const Member = require("../scripts/member");

module.exports = {
    async tick({ author, channel, content })
    {
        const member = await Member.load(author.id);

        member.msg_me++;

        if(member.house)
        {
            const house = process.houses[member.house];
            house.xp += Math.ceil(Math.random() * 10) + 20;
            house.save();
            member.msg_house++;
        }

        // ? Deduction category
        if(channel.parentId === '852185049860276304' && content.match(/(?<=\|\|).{25,}(?=\|\|)/gm))
        {
            member.msg_ded++;
            return member.save();
        }

        member.save();
    },
};