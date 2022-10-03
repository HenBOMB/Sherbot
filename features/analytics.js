const Member = require("../scripts/member");
const House = require("../scripts/house");

// ? Deduction channels
const channels = ['852185253279170572', '852469428759298058', '852185225432793108', '856119014597459998', '868129935347286026'];

module.exports =
{
    tick : async function(message)
    {
        const member = await Member.load(message.author.id);

        member.msg_me++;

        if(member.house)
        {
            const house = House.get(member.house);
            House.edit(member.house, 'xp', house.xp + Math.ceil(Math.random() * 10) + 20);
            member.msg_house++;
        }

        if(channels.includes(message.channel.id) && message.content.match(/(?<=\|\|).{25,}(?=\|\|)/gm))
        {
            member.msg_ded++;
            return member.save();
        }

        member.save();
    },
};