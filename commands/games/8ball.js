const { RandomItem } = require("../../../tools/random.js")
const { readFileSync } = require("fs")

var cache = [];

var lines = readFileSync('./sherbot/data/games/8ball.txt').toString().split('\n');

module.exports =
{
    commands:['8ball'],

    execute : async function(message, embed, mention) 
    {
        return;
        
        if(message.content.length === 0)
            return message.channel.send("Usage: `?8ball [text]`");

        let chosen = RandomItem(lines);

        while(cache.includes(chosen))
            chosen = RandomItem(lines);
        
        if(cache.length >= lines.length / 2) cache = [];
            
        cache.push(chosen);

        message.channel.send(chosen)
    },

    initialize : async function(client, con, data)
    {
        
    }
}