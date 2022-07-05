const { MessageEmbed } = require('discord.js');
const PuzzleLibrary = require('./puzzle_library_util.js');

var puzzle;

module.exports =
{
    commands:['math'],

	execute : async function (message, embed, args) 
    {
        puzzle.send(message.channel, args);
    },

    initialize : function(client, con, data)
    {
        const embed = new MessageEmbed()
            .setThumbnail('https://media.discordapp.net/attachments/910948176054341673/910948197210415105/170659_1.png')
            .setColor('9afc07');
        puzzle = new PuzzleLibrary('https://www.riddles.com/math-riddles?page=','math', embed, 17);
        return true;
    },

    interact : i => puzzle.interact(i)
};