// https://discoid.cc
// https://discoid.cc/uuid

const https = require('https');

module.exports =
{
    commands:['idlookup'],
    
	execute : async function(message, embed, args) 
    {
        if(isNaN(args[0]))
        {
            return message.channel.send("Invalid user id.");
        }

        https.get('https://discoid.cc/' + args[0], res => {
            let data = "";

            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                if(data.includes('text-muted discriminator'))
                {
                    const pfp = data.match(/(?<=<meta name="image" content=").+?(?= \/)/)[0];
                    const username = data.match(/(?<=Username.+> ).+?(?=<)/)[0];
                    const discriminator = data.match(/(?<=Discriminator.+> ).+?(?=<)/)[0];
                    const created = data.match(/(?<=Account Created.+> ).+?(?=<)/)[0];
                    const isBot = data.match(/(?<=Bot Account.+> ).+?(?=<)/)[0];
        
                    embed
                    .setDescription(`Tag: \`${username}#${discriminator}\` \nBot: \`${isBot}\` \nCreated: \`${created}\``)
                    .setThumbnail(pfp)

                    message.channel.send({ embeds: [embed] });
                }
                else
                {
                    message.channel.send("No user with that id found.")
                }
            })
        })
    },

    initialize : async function(cl, con, data)
    {

    },
};