const Member = require("../scripts/member");
// const House = require("../scripts/house");

const members = {};
// Deduction channels
const channels = ['852185253279170572', '852469428759298058', '852185225432793108', '856119014597459998', '868129935347286026'];

module.exports =
{
    initialize : function(guild, con, data) { },
    
    tick : async function(message)
    {
        const member = members[message.author.id] || await Member.load(message.author.id);
        members[message.author.id] = member;

        member.msg_me++;

        if(member.house)
        {
            // const house = await House.get(connection, member.house);
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