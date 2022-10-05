const { Colors } = require('discord.js');
const { scheduleJob, RecurrenceRule } = require('node-schedule');

module.exports = {
    initialize() 
    {
        // ? Exclude the info channel and make sure its a jail channel
        const getChannels = () => process.guild.channels.cache.filter(v => v.parentId === '1025816106985852948' && v.name.includes('cell'));
        
        // ? Enables sending messages after 6:30am

        const rule1 = new RecurrenceRule();
        rule1.hour = 6;
        rule1.minute = 30;
        rule1.tz = 'Etc/UTC';

        scheduleJob(rule1, () => {
            getChannels().forEach(channel => {
                channel.permissionOverwrites.edit('670113370938277888', {
                    SendMessages: true
                })
            });
            process.log('Jail', '**Wake-up, all cells opened.**', Colors.Yellow);
        });

        // ? Disables sending messages after 8pm

        const rule2 = new RecurrenceRule();
        rule2.hour = 20;
        rule2.minute = 0;
        rule2.tz = 'Etc/UTC';

        scheduleJob(rule2, () => {
            getChannels().forEach(channel => {
                channel.permissionOverwrites.edit('670113370938277888', {
                    SendMessages: false
                })
            });
            process.log('Jail', '**Retiring, all cells closed.**');
        });

        // ? Disable sending messages in other cells
        
        process.conn.query(`SELECT * FROM jail`, (err, res) => {
            process.logError(err);
            const channels = getChannels();
            
            res.forEach(async info => {
                const member = await process.guild.members.fetch(info.id);

                channels.forEach(channel => {

                    if(channel.id === info.cell)
                    {
                        channel.permissionOverwrites.create(member, {
                            SendMessages: true
                        });
                    }
                    else
                    {
                        channel.permissionOverwrites.create(member, {
                            SendMessages: false
                        });
                    }
                })
            })
        });
    }
};