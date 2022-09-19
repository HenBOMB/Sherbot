const { EmbedBuilder } = require('discord.js');

/// Base class representing a CLI and interpereter
class CLI
{
    constructor()
    {
        this.parms = {};
        this.logs = [];
    }

    /// Adds a new executable argument
    add(name, log, cb)
    {
        this.params[`--${name}`] = {cb, log};
        return this;
    }

    /// Prints out the logs
    log(channel)
    {
        if(this.logs.length > 0)
        {
            channel.send({ embeds: [new EmbedBuilder().setColor('GREEN').setDescription(`${this.logs.join('\n')}`)] });
        }
    }

    /// Execute the arguments
    async execute(text, def = ['--view'])
    {
        this.logs = [];
        
        const d = text.replace(/^\?\w+/gm,'');

        // ? ['--name', '--color', '--create']
        const arg_all = d.match(/--\w+/gm) || def;
        
        // ? ['--name henry', '--color red']
        const arg_vals = d.match(/--[\w\d,'"@: ]+ [\w\d,'"@: ]+/gm);

        // ? ['--create']
        const arg_solo = d.replace(/--[\w\d,'"]+ [\w\d,'"]+/gm, '').match(/\-\-[\w\d,'"]+/gm) || def;
       
        for(const arg of arg_solo)
        {
            try {
                const output = await arg.cb();
                this.logs.push(`${output===false?'✗':'✓'} ${arg.log}`);
            } catch (err) {
                this.logs.push(`✗ ${arg.log} (${err})`);
            }
        }
        
        for(const arg of arg_all)
        {
            for(const arg1 of arg_vals)
            {
                // ? If two args have the same key
                if(arg1.match(/--\w+/gm) !== arg) continue;

                const param = this.params[arg];
                const input = arg1.replace(/--\w+/gm, '').trim();

                try {
                    const output = await param.cb(input);
                    this.logs.push(`${output===false?'✗':'✓'} ${param.log}`);
                } catch (err) {
                    this.logs.push(`✗ ${param.log} (${err})`);
                }
            }
        }
    }
}

module.exports = CLI;