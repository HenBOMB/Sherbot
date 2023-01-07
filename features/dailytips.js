const { get } = require('https');
const { scheduleJob, RecurrenceRule } = require('node-schedule');
const { EmbedBuilder } = require('discord.js');

const { dtips_url } = require('../config.json');

var tipIndex;
var page;
var channel;

class DailyTips 
{
    static initialize() 
    {
        process.conn.query(`SELECT tip_page, tip_index FROM sherbot WHERE id = '${process.guild.id}'`, async (err, res) => {
            process.logError(err);
            page = res[0].dt_page;
            tipIndex = res[0].dt_index;
            channel = process.guild.channels.cache.get('740552730250313809'); 
    
            const rule = new RecurrenceRule();
            rule.hour = 12;
            rule.minute = 0;
            rule.tz = 'Etc/UTC';
            
            scheduleJob(rule, () => {
                const DailyTips = require("./dailytips");
                DailyTips.dailyTip();
            });
        });
    }

    static async dailyTip()
    {
        const embed = new EmbedBuilder().setColor(process.botColor);
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

        process.conn.query(`UPDATE sherbot SET tip_page = ${page}, tip_index = ${tipIndex} WHERE id = 670107546480017409`, process.logError);
    }
}

module.exports = DailyTips;