const https = require('https');
const { readFileSync } = require("fs")

const options = {
    agent : new https.Agent()
}

const uri = 'https://glosbe.com/en/non/';
const dict = readFileSync('./sherbot/commands/translators/norse.txt').toString().toLowerCase();


//https://glosbe.com/en/non/zero
//https://oldnorse.org/2020/09/06/the-old-norse-dictionary/
//https://www.vikingsofbjornstad.com/Old_Norse_Dictionary_E2N.shtm
//https://omniglot.com/language/numbers/oldnorse.htm
//no doesnt work
// maybe revert back to using ; and , and see what ; means and what , means

module.exports =
{
    commands:['norse'],
    
	execute : async function(message, embed) 
    {
        const words = message.content.trim().split(' ');
        let formed = '';

        /*
        await new Promise(async resolve => {
            
            for (let word of words) 
            {
                https.get(uri + word, options, res => {
                    let data = "";
        
                    res.on('data', chunk => data += chunk);
        
                    res.on('end', () => {
                        data = data.match(/(?<=n=").+(?=" c)/);

                        if(data === null)
                            formed[word] = "unknown";
                        else
                            formed[word] = data[0];
                        console.log(formed)
                    })
                })
            }

            console.log(formed);

            resolve();
        });
        */

        for (let word of words) 
        {
            word = word.toLowerCase();
            word = word.replace(/[,\.;:]/gm,'');

            let res = dict.match('(?<=\n'+word+',.+# ).+');
    
            if(res === null)
            {
                res = dict.match('(?<=\n'+word+' .+# ).+');

                if(res === null)
                    formed += `*${word}*`;
                else
                    formed += this.cleanResult(res);
            }
            else
                formed += this.cleanResult(res);

            formed += ' ';
        }

        formed.replace(/\(‡\)/gm, '')

        message.channel.send(formed.trim())
    },

    initialize : async function(cl, con, data)
    {

    },

    cleanResult(res)
    {
        res = res[0];
        let s = res.split(',');
        
        if(s.length > 1)
            res = s[0];

        return res.trim();
    }
};