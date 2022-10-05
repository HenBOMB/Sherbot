const { Colors } = require("discord.js");

module.exports = {
    initialize()
    {
        process.guild.client.on('messageReactionAdd', async ({ message, me, emoji }, user) => {
            if(emoji.name !== '✅' || user.id !== process.ownerId) return;
            this.executeCode(await message.fetch());
        });
    },

    async tick(message)
    {
        if(!(message.member?.id === process.ownerId)) return;
        
        if(message.content.length < 3) return;

        this.executeCode(message);
    },

    async executeCode(message)
    {
        const cmd = message.content.split(' ')[0].toLowerCase();

        if(cmd !== 'js' && cmd !== 'sql') return;

        await message.reactions.removeAll();

        await message.react('🔄');
        
        let code = message.content.slice(cmd.length + 1).replace(/```[.\w]+|```$/gm, '')

        if(cmd == 'sql')
        {
            code = `
                try {
                    return await new Promise(resolve => {
                        process.conn.query(\"${code}\", (err, res) => {
                            resolve(res || err);
                        });
                    });
                }
                catch(error) {
                    return error;
                }
            `
        }
        
        code = `(async () => { try{ ${code} } catch(error){ return error; } })`;

        process.catchErrorLogs = [];

        try 
        {
            const result = await eval(code)();

            await message.reactions.removeAll();

            const caughtLogs = [...process.catchErrorLogs];
            process.catchErrorLogs = null;

            if(!result)
            {
                return await message.react('☑️');
            }

            if(caughtLogs.length > 0)
            {
                await message.react('❎');
                return caughtLogs.forEach(async error => {
                    await process.logError(error, message);
                });
            }

            if(await process.logError(result, message))
            {
                return message.react('❎');
            }
            else
            {
                await message.react('✅');
                process.log(null, description=`\`\`\`js\n${JSON.stringify(result, null, 2)}\`\`\``, Colors.Green, message);
            }
        }
        catch (error) 
        {
            process.catchErrorLogs = null;
            process.logError(error, message);
        }
    }

};