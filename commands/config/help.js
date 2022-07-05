
module.exports =
{
    commands:['help', 'h'],

	execute : async function(message, embed, args) 
    {
        embed
        .setFooter('prefix : ? • ✕ : not working • [] : required • () : optional')
        .setDescription(
`
**General**
\`help\`
⬥ Help list.
\`rpsca [@user]\`
✕ Rock Paper Scissors Cellular Automata
\`8ball [text]\`
✕ Sassy 8ball (uses a neural net to generate answers)
\`idlookup [uid]\`
⬥ Looks up a discord user's id and returns some info on it.
\`sherlock [username]\`
⬥ Hunt down social media accounts by username across social networks. Hacking tool made by me in javascript (Was inspired by the original python version)\n*(request permission to use)**

**Puzzles**
\`riddle\`, \`math\`, \`whatami\`, \`whatisit\`, \`whoami\`

**Translators**
\`norse [text]\`
⬥ Translates from english to the [old norse](https://en.wikipedia.org/wiki/Old_Norse) language
(60%~ accurate, does not support past tense, plural words, keep it simple and clear without symbols)
`);

        message.channel.send({embeds:[embed]})
    },

    initialize : async function(client, con, data)
    {
        
    },
};