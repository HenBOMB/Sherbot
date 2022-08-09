var connection;
var client;

module.exports =
{
    name : "sudo",

    initialize : function(guild, con, data)
    {
        connection = con;
        client = guild.client;
    },

    tick : async function(message)
    {
        if(message.content.length < 3 || message.member == null) return false;
		if(message.member.id != process.env.ownerid) return false;

		const args = message.content.toLowerCase().trim().split(' ');
		const cmd = args[0];
        if(cmd !== 'sudo') return false;

		if(args[1] !== 'embed') 
        {
            await message.delete()
            return message.channel.send(message.content.slice(5));
        }

        const code = message.content.slice(10).replace(/^```+|```$/, '');

        try 
        {
            message.channel.send({embeds:[JSON.parse(code)]});
        }
        catch (error) 
        {
            message.channel.send(`\`\`\`js\n${ error.toString() }\`\`\``);
        }

        return true;
    },
};