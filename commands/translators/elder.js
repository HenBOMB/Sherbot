const https = require('https');
const { readFileSync, writeFileSync } = require("fs")
var data = JSON.parse(readFileSync('./sherbot/commands/translators/elder.json'))

const symbolRegex = /[\d,.<>/¿?;:'"\\|/\-_=+)(*&^%$#@!¡~`{}[\]\^‹›«”“„»±·–—£¢€₹¥₱№]+/g

module.exports =
{
    commands:['elder'],
    
	execute : async function(message, embed) 
    {
        
    },

    initialize : async function(cl, con, data)
    {

    }
};

// ez nn -> 
// https://towardsdatascience.com/heres-how-to-build-a-language-translator-in-few-lines-of-code-using-keras-30f7e0b3aa1d
// missing names in translation data

//https://witcher.fandom.com/wiki/Nilfgaardian_language
//https://witcher.fandom.com/wiki/Elder_Speech
// symbols:
// https://redanianintelligence.com/2020/07/19/the-witcher-language-creator-publishes-extensive-material-including-information-about-a-mysterious-new-character/

// console.log(translate("Daughter of the Elder Blood"))

function translate(text)
{
    console.log('______________________')
    console.log('\n' + text + '\n')

    //////////////////////////////////////////////////////////

    let translation = ''

    text = text.trim().replace(/\?/g,'')

    text = text.replace(/'s/g, ' is')

    // identify marking hereditary names and replace correspondingly.

    let x = text.split(' ')
    for (let i = 0; i < x.length; i++)
    {
        if(isUpper(x[i]))
        {
            if(i > 0 && x[i - 1] == 'of')
            {
                let l = text.search(x[i])
                text = text.slice(0, l - 3) + 'of¹ ' + text.slice(l)
            }

            if(i > 2 && x[i - 1] == 'the')
            {
                if(x[i - 2] == 'of')
                {
                    let l = text.search(x[i])
                    text = text.slice(0, l - 7) + 'of¹ ' + text.slice(l)
                }
            }
        }
    }

    // aep * of - mostly used for marking hereditary ties
    //text = text.replace(/of the/g, 'of¹')
    text = text.replace(/of the/g, '')

    // cleanup 
    text = text.replace(/the/g, '')

    //////////////////////////////////////////////////////////

    text.split(' ').forEach(word => {
        
        translation += ' '

        // Check if has any special characters
        let specialChars = word.match(symbolRegex)
        let endSpecial = ''
        let isUp = isUpper(word)

        if(specialChars != null)
        {
            // Can either be in the first or last position, nowhere else!

            if(specialChars.length == 1)
            {
                let index = word.search(symbolRegex)
                if(index == 0)
                    translation += specialChars[0]
                else
                    endSpecial = specialChars[0]
            }
            else
            {
                translation += specialChars[0]
                endSpecial = specialChars[1]
            }
        }

        word = word.replace(symbolRegex, '').toLowerCase()
        if(word in data)
            translation += isUp? capitalize(data[word]) : data[word];
        else
            translation += isUp? capitalize(word) : word

        translation += endSpecial;
    });
    
    return translation.trim().replace(/  /g, ' ');

    //////////////////////////////////////////////////////////
}

function isUpper(text)
{
    text = text.match(/\w/g,'')
    if(text == null)
        return false
    
    return text[0] == text[0].toUpperCase()
}

function capitalize(text)
{
    return text[0].toUpperCase() + text.slice(1)
}

/*

add:

(?<=<td>).+(?=\n)

remove:

<sup.+\/sup>
<a .+<\/a>
*/


//const lines = readFileSync('./sherbot/commands/translators/elder.txt').toString().split('\n');

data = readFileSync('./sherbot/commands/translators/elder_clean.txt').toString().toLowerCase().split('\n')

for (let i = 0; i < data.length; i++) 
{
    let v = data[i].split(' - ')
    data[i] = capitalize(v[0]) + ' - ' + capitalize(v[1])
}

writeFileSync('././sherbot/commands/translators/elder_clean.txt', data.toString().replace(',','\n'))
