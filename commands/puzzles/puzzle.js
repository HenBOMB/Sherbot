const { MessageEmbed } = require('discord.js');
const PuzzleLibrary = require('./lib_util.js');

const puzzles = [];

//https://www.ahapuzzles.com/logic/logic-puzzles/
//https://duckduckgo.com/?q=color+picker&t=opera&ia=answer
//https://www.youtube.com/watch?v=5qap5aO4i9A

module.exports =
{
    commands: ['puzzle', 'whatami', 'whoisit', 'whoami', 'math', 'riddle'],

	execute : async function (message, embed, args, cmd) 
    {
        switch (cmd) {
            case 'puzzle':
                return puzzles[Math.floor(Math.random() * 8)].send(message.channel);
            case 'whatami':
                return puzzles[1].send(message.channel);
            case 'whoisit':
                return puzzles[2].send(message.channel);
            case 'whoami':
                return puzzles[3].send(message.channel);
            case 'math':
                return puzzles[4].send(message.channel);
            case 'riddle':
                return puzzles[Math.floor(Math.random() * 2)+5].send(message.channel);
        }
    },

    initialize : function(client, con, data)
    {
        const embed = new MessageEmbed()
            .setThumbnail('https://cdn3.iconfinder.com/data/icons/brain-games/1042/Puzzle-grey.png')
            .setColor('RANDOM');

        puzzles.push(new PuzzleLibrary('logic', embed, 10));
        puzzles.push(new PuzzleLibrary('what-am-i-riddles', embed, 3));
        puzzles.push(new PuzzleLibrary('who-is-it-riddles', embed, 3));
        puzzles.push(new PuzzleLibrary('who-am-i-riddles', embed, 3));
        puzzles.push(new PuzzleLibrary('math-riddles', embed, 17));
        
        puzzles.push(new PuzzleLibrary('best-riddles', embed, 10));
        puzzles.push(new PuzzleLibrary('riddles-for-adults', embed, 12));
        puzzles.push(new PuzzleLibrary('difficult-riddles', embed, 17));

        return true;
    },

    interact : function(i) 
    {
        switch (cmd) {
            case 'logic':
                return puzzles[0].interact(i)
            case 'what-am-i-riddles':
                return puzzles[1].interact(i)
            case 'who-is-it-riddles':
                return puzzles[2].interact(i)
            case 'who-am-i-riddles':
                return puzzles[3].interact(i)
            case 'math-riddles':
                return puzzles[4].interact(i)
            case 'best-riddles':
                return puzzles[5].interact(i)
            case 'riddles-for-adults':
                return puzzles[6].interact(i)
            case 'difficult-riddles':
                return puzzles[7].interact(i)
        }
    }
};