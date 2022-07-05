const https = require('https');
const uri = 'https://aguidetodeduction.tumblr.com/tagged/A+Guide+to+Deduction/page/';
const schedule = require('node-schedule');
const rule = new schedule.RecurrenceRule();
const { MessageEmbed } = require('discord.js');

var tipIndex;
var page;
var connection;
var channel;
var enabled;

var job;

class MyStaticClass 
{
    static execute ()
    {
        enabled = !enabled;
        
        connection.query(`UPDATE sherbot SET dt_on = ${enabled} WHERE id = 670107546480017409`,
        (err) => {
            if(err) 
            {
                channel.guild.channels.get('718576277329674361').send({ content: "@HenBOMB.#0274\n**Failed to update data on `dailytips.js`** (dt_on)" })
                return;
            }

            console.log("update: dt_on (dailytips.js)")
        });

        if(!enabled)
        {
            if(job != undefined)
            job.cancel();
            return;
        }
        
        job = schedule.scheduleJob(rule, function(){
            console.log("sending daily tip");
            const MyStaticClass = require("./dailytips");
            MyStaticClass.dailyTip();
        });
    }

    static initialize (guild, con, data) 
    {
        rule.hour = 0;
        rule.minute = 0;
        rule.tz = 'Etc/UTC';

        page = data.dt_page;
        tipIndex = data.dt_index;
        enabled = data.dt_on == 1? true : false;

        connection = con;
        channel = guild.channels.cache.get('740552730250313809'); 
        
        job = schedule.scheduleJob(rule, function(){
            console.log("sending daily tip");
            const MyStaticClass = require("./dailytips");
            MyStaticClass.dailyTip();
        });
    }

    static async dailyTip(_page, _index, c)
    {
        if(_index != undefined) 
        {
            tipIndex = _index;
            page = _page;
        }

        let member = channel.guild.members.cache.get('712429527321542777');
        let hex = null;

        if(member.roles != undefined)
        {
            hex = member.roles.color;
            hex = hex == null? "ffffff" : member.roles.color.hexColor;
        }
        else 
            hex = member;

        const embed = new MessageEmbed().setColor(hex);

        await new Promise(resolve => {
            https.get(uri + (178 - page), (resp) => 
            {
                let data = "";
    
                resp.on('data', (chunk) =>
                {
                    data += chunk;
                })
    
                resp.on('end', () => 
                {
                    data = data.slice(data.indexOf(`post"`) + 5)
                    let imgUrls = []

                    while (data.includes("_500")) 
                    {
                        let index = data.indexOf(`_500`)

                        let url = data.slice(index-80, index+8)

                        url = url.slice(url.indexOf("c=") + 3)

                        data = data.slice(index + 20)

                        imgUrls.push(url)
                    }

                    let image = imgUrls[imgUrls.length - tipIndex - 1];

                    tipIndex+=1;

                    if(tipIndex == imgUrls.length)
                    {
                        tipIndex = 0;
                        page+=1;
                    }
                
                    embed.setImage(image)
                    .setDescription("<@&740693917514727431>")
                    
                    channel.send({ embeds: [embed] })
                    resolve();
                })

                resp.on('error', () => {
                    console.log(error);
                    resolve();
                });
            })
        })

        connection.query(`UPDATE sherbot SET dt_page = ${page}, dt_index = ${tipIndex} WHERE id = 670107546480017409`,
        (err) => {
            if(err) 
            {
                channel.guild.channels.get('718576277329674361').send({ content: "@HenBOMB.#0274\n**Failed to update data on `dailytips.js`** (dt_page, dt_index)" })
                return;
            }

            console.log(`update: dt_page = ${page}, dt_index = ${tipIndex} (dailytips.js)`)
        });
    }
}

module.exports = MyStaticClass;