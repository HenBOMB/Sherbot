module.exports =
{
    name : "exc",

    initialize : function(guild, con, data) { },

    tick : async function(message)
    {
        if(message.content.length < 3 || message.member == null) return false;
        if(message.author.id != process.env.ownerid) return
        let cmd = message.content.split(' ')[0].toLowerCase().trim();
        if(cmd !== 'js' && cmd !== 'sql') return false;
        
        let code = message.content.slice(4).replace(/^```+|```$/, '');

        if(cmd == 'sql')
        {
            code = `
            try{
                return await new Promise(resolve => {
                    process.conn.query(\"${code}\", (err, res) => {
                        resolve(res || err);
                    })
                })
            }
            catch(err){
                return err;
            }
            `
        }

        code = "(async () => { try{" + code + "} catch(err){ return err } })";
        
        // end parse
        
        if(!code) return false;

        try 
        {
            const result = await eval(code)();
            if(!result) return true;
            message.channel.send(`\`\`\`js\n${ JSON.stringify(result.code || result, null, 2) }\`\`\``);
        }
        catch (err) 
        {
            message.channel.send(`\`\`\`js\n${ err.toString() }\`\`\``);
        }

        return true;
    },
};