const { MessageEmbed } = require('discord.js');
const PuzzleLibrary = require('./puzzle_library_util.js');

var puzzle;

//https://www.ahapuzzles.com/logic/logic-puzzles/
//https://duckduckgo.com/?q=color+picker&t=opera&ia=answer
//https://www.youtube.com/watch?v=5qap5aO4i9A

module.exports =
{
    commands:['riddle', 'logic'],

	execute : async function (message, embed, args) 
    {
        puzzle.send(message.channel, args);
    },

    initialize : function(client, con, data)
    {
        const embed = new MessageEmbed()
            .setThumbnail('https://image.flaticon.com/icons/png/512/170/170659.png')
            .setColor('2fd0d8');
        puzzle = new PuzzleLibrary('https://www.riddles.com/logic-puzzles?page=', "logic", embed, 10);
        return true;
    },

    interact : i => puzzle.interact(i)
};