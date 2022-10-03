const Member = require("../scripts/member");
const House = require("../scripts/house");

module.exports =
{
    tick : async function({ author, channel, content })
    {
        const member = await Member.load(author.id);

        member.msg_me++;

        if(member.house)
        {
            const house = House.get(member.house);
            House.edit(member.house, 'xp', house.xp + Math.ceil(Math.random() * 10) + 20);
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