
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

**Puzzles**
\`puzzle\`, \`riddle\`

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