module.exports =
{
    tick : async function(message)
    {
        if(!(message.member?.id === '348547981253017610')) return
        
        if(message.content.length < 3 || message.member == null) return false;

        let cmd = message.content.split(' ')[0].toLowerCase().trim();

        if(cmd !== 'js' && cmd !== 'sql') return false;

        await message.react('🔄')
        
        let code;

        if(cmd == 'sql')
        {
            code = message.content.slice(4).replace(/^```+|```$/, '')
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
        else
        {
            code = message.content.slice(3).replace(/^```+|```$/, '')
        }

        code = "(async () => { try{" + code + "} catch(err){ return {err} } })";
        
        try 
        {
            const result = await eval(code)();

            message.reactions.removeAll()

            if(!result)
            {
                await message.react('❎')
                message.channel.send(`\`\`\`js\n${ JSON.stringify(result.err || result, null, 2) }\`\`\``);
                return true;
            }

            await message.react(result.errno||result.err?'❎':'✅')

            if(result.errno)
            {
                message.channel.send(`\`\`\`sql\n${ JSON.stringify(result.sqlMessage, null, 2) }\`\`\``);
            }
            else
            {
                message.channel.send(`\`\`\`js\n${ JSON.stringify(result.code || result, null, 2) }\`\`\``);
            }

        }
        catch (err) 
        {
            message.channel.send(`\`\`\`js\n${ err.toString() }\`\`\``);
        }

        return true;
    },
};