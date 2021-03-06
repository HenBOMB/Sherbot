const Discord = require('discord.js');
const fs = require('fs');

var connection;
var client;

module.exports =
{
    name : "jsexec",

    initialize : function(guild, con, data)
    {
        connection = con;
        client = guild.client;
    },

    tick : async function(message)
    {
        if(message.content.length < 3 || message.member == null) return false;
        let cmd = message.content.split(' ')[0].toLowerCase().trim();
        if(cmd !== 'js' && cmd !== 'sql') return false;

        // begin check

        if(message.member.id != process.env.ownerid)
            message.channel.send(`Ahem, no touchie`);

        // end check

        // begin parse
        
        let code = message.content.slice(3).replace(/^```+|```$/, '');

        if(cmd == 'sql')
        {
            code = `
            return await new Promise((resolve) => {
                connection.query(\"${code}\", (err, res) => { 
                    resolve(res.length == 1? res[0] : res);
                })
            })
            `
        }

        code = "(async () => { " + code + " })";
        
        // end parse
        
        if(code == undefined) 
            return false;

        try 
        {
            const result = await eval(code)();

            if(result == undefined)
                return true;

            message.channel.send(`\`\`\`js\n${ JSON.stringify(result, null, 2) }\`\`\``);
        }
        catch (error) 
        {
            message.channel.send(`\`\`\`js\n${ error.toString() }\`\`\``);
        }

        return true;
    },
};