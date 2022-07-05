const { RandomItem, RandomNumber, RandomBool } = require('../../../tools/random.js');

const vowels = ['a','e','i','o','u']

module.exports =
{
    commands:['uwu'],
    
	execute : async function(message, embed) 
    {
        let text = message.content;

        text = text.toLowerCase().trim();

        // replace r, l with w
        // replace ou with ouw

        text = text.replace(/[rl]/gm, 'w');

        // forgot what this did
        text = text.replace(/ul /gm, '### ');

        text = text.replace(/wie/gm, 'we');

        text = text.replace(/### /gm, 'ul ');

        // only nya-ify if it's space followed by 'n'

        

        // sies-ify (cats -> catsies)
        
        let words = text.split(' ');
        let formed = '';

        for (let word of words)
        {
            const letters = word.split('');

            if(letters[letters.length - 1] === 's')
        }

        // stutter

        words = text.split(' ');
        formed = '';
        let stutter = RandomNumber(words.length) + 1;

        for(let word of words)
        {
            stutter--;

            formed += ' ';

            const letters = word.split('');

            if(stutter !== 0)
            {
                formed += word;
                continue;
            }

            if(RandomBool()) formed += letters[0] + '-';

            formed += word;
        }

        //

        message.channel.send(uwu);
    },

    initialize : async function(cl, con, data)
    {

    },

  
};