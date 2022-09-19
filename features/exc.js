const connection = process.env.conn;

module.exports =
{
    name : "exc",

    initialize : function(guild, con, data) { },

    tick : async function(message)
    {
        if(message.content.length < 3 || message.member == null) return false;
        let cmd = message.content.split(' ')[0].toLowerCase().trim();
        if(cmd !== 'js' && cmd !== 'sql') return false;

        if(message.member.id != process.env.ownerid)
            return
        
        let code = message.content.slice(3).replace(/^```+|```$/, '');

        if(cmd == 'sql')
        {
            code = `
            try{
                return await new Promise((resolve) => {
                    connection.query(\"${code}\", (err, res) => {
                        resolve(res? res.length == 1? res[0] : res : err);
                    })
                })
            }
            catch(e){
                return e
            }
            `
        }

        code = "(async () => { try{" + code + "} catch(e){ return e } })";
        
        // end parse
        
        if(code == undefined) 
            return false;

        try 
        {
            const result = await eval(code)();

            if(result == undefined)
                return true;

            message.channel.send(`\`\`\`js\n${ JSON.stringify(result.code || result, null, 2) }\`\`\``);
        }
        catch (error) 
        {
            message.channel.send(`\`\`\`js\n${ error.toString() }\`\`\``);
        }

        return true;
    },
};