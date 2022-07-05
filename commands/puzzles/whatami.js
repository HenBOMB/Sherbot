const { MessageEmbed } = require('discord.js');
const PuzzleLibrary = require('./puzzle_library_util.js');

var puzzle;

module.exports =
{
    commands:['whatami'],

	execute : async function (message, embed, args) 
    {
        puzzle.send(message.channel, args);
    },

    initialize : function(client, con, data)
    {
        const embed = new MessageEmbed()
            .setThumbnail('https://image.flaticon.com/icons/png/512/170/170659.png')
            .setColor('2fd87b');
        puzzle = new PuzzleLibrary('https://www.riddles.com/what-am-i-riddles?page=', 'whatami', embed, 28);
        return true;
    },

    interact : i => puzzle.interact(i)
};