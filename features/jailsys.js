const { Colors } = require('discord.js');
const { scheduleJob, RecurrenceRule } = require('node-schedule');

module.exports =
{
    initialize : function(guild, data) 
    {
        // ? Exclude the info channel and make sure its a jail channel
        const getChannels = () => process.guild.channels.cache.filter(v => v.parentId === '1025816106985852948' && v.id !== '1026245265558077520');
        
        // ? Enables sending messages after 6:30am
        scheduleJob(new RecurrenceRule(hour=6, minute=30, tz='Etc/UTC'), () => {
            getChannels().forEach(channel => {
                channel.permissionOverwrites.edit('670113370938277888', {
                    SendMessages: true
                })
            });
            process.log('Jail', 'Wake-up, all cells opened.', Colors.Yellow)
        });

        // ? Disables sending messages after 8pm
        scheduleJob(new RecurrenceRule(hour=20, tz='Etc/UTC'), () => {
            getChannels().forEach(channel => {
                channel.permissionOverwrites.edit('670113370938277888', {
                    SendMessages: false
                })
            });
            process.log('Jail', 'Retiring, all cells closed.')
        });

        // ? Disable sending messages in other cells
        process.conn.query(`SELECT * FROM jail`, (err, res) => {
            const channels = getChannels();
            
            res.forEach(async info => {
                const member = await process.guild.members.fetch(info.id);

                channels.forEach(channel => {

                    if(channel.id === info.cell)
                    {
                        channel.permissionOverwrites.create(member, {
                            SendMessages: true
                        })
                    }
                    else
                    {
                        channel.permissionOverwrites.create(member, {
                            SendMessages: false
                        })
                    }
                })
            })
        });
    },
    
    tick : async function(message)
    {
        
    },
};