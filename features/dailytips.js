const { get } = require('https');
const { scheduleJob, RecurrenceRule } = require('node-schedule');
const { EmbedBuilder } = require('discord.js');

const { dtips_url } = require('../config.json');

var tipIndex;
var page;
var channel;

class DailyTips 
{
    static initialize(guild, { dt_page, dt_index }) 
    {
        page = dt_page;
        tipIndex = dt_index;
        channel = guild.channels.cache.get('740552730250313809'); 

        const rule = new RecurrenceRule();
        rule.hour = 12;
        rule.minute = 0;
        rule.tz = 'Etc/UTC';
        
        scheduleJob(rule, () => {
            const DailyTips = require("./dailytips");
            DailyTips.dailyTip();
        });
    }

    static async dailyTip()
    {
        const member = channel.guild.members.cache.get('712429527321542777');
        const embed = new EmbedBuilder().setColor(member.roles.color.color || member.roles.color.hexColor || "#ffffff");
        const imgUrls = [];

        await new Promise(resolve => {
            get(dtips_url + (178 - page), (res) => 
            {
                let data = "";
    
                res.on('data', chunk => {
                    data += chunk;
                })
    
                res.on('end', () => {
                    data = data.slice(data.indexOf(`post"`) + 5);

                    while (data.includes("_500")) 
                    {
                        const index = data.indexOf(`_500`);
                        let url = data.slice(index-80, index+8);

                        url = url.slice(url.indexOf("c=") + 3);
                        data = data.slice(index + 20);

                        imgUrls.push(url);
                    }

                    const image = imgUrls[imgUrls.length - tipIndex - 1];

                    tipIndex+=1;

                    if(tipIndex == imgUrls.length)
                    {
                        tipIndex = 0;
                        page+=1;
                    }
                
                    embed.setImage(image).setDescription("<@&740693917514727431>");
                    
                    channel.send({ embeds: [embed] }).then(async msg => {
                        await msg.react('👍');
                        await msg.react('👎');
                    });

                    resolve();
                });

                res.on('error', resolve);
            });
        });

        process.conn.query(`UPDATE sherbot SET dt_page = ${page}, dt_index = ${tipIndex} WHERE id = 670107546480017409`, (err) => {});
    }
}

module.exports = DailyTips;