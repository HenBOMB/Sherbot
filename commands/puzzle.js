const { EmbedBuilder, Colors } = require('discord.js');
const PuzzleLibrary = require('../scripts/puzzle_lib');

const puzzles = [];

//https://www.ahapuzzles.com/logic/logic-puzzles/
//https://duckduckgo.com/?q=color+picker&t=opera&ia=answer
//https://www.youtube.com/watch?v=5qap5aO4i9A

module.exports =
{
    commands: ['puzzle', 'whatami', 'whoisit', 'whoami', 'math', 'riddle', 'teaser'],

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
            case 'teaser':
                return puzzles[8].send(message.channel);
        }
    },

    initialize : function(conn)
    {
        let embed = new EmbedBuilder().setColor(Colors.Orange);
        
        puzzles.push(new PuzzleLibrary('logic-puzzles', embed, 10));
        puzzles.push(new PuzzleLibrary('what-am-i-riddles', embed, 3));
        puzzles.push(new PuzzleLibrary('who-is-it-riddles', embed, 3));
        puzzles.push(new PuzzleLibrary('who-am-i-riddles', embed, 3));
        puzzles.push(new PuzzleLibrary('math-riddles', embed, 17));
        
        puzzles.push(new PuzzleLibrary('best-riddles', embed, 10));
        puzzles.push(new PuzzleLibrary('riddles-for-adults', embed, 12));
        puzzles.push(new PuzzleLibrary('difficult-riddles', embed, 17));

        puzzles.push(new PuzzleLibrary('brain-teasers', embed, 29));

        return true;
    },

    interact : function(cmd, i) 
    {
        cmd = cmd.split('-')[0]
        switch (cmd) {
            case 'logic':
                return puzzles[0].interact(i)
            case 'what':
                return puzzles[1].interact(i)
            case 'who':
                if(cmd.split('-')[1] === 'is')
                    return puzzles[2].interact(i)
                else
                    return puzzles[3].interact(i)
            case 'mathr':
                return puzzles[4].interact(i)
            case 'best':
                return puzzles[5].interact(i)
            case 'riddles':
                return puzzles[6].interact(i)
            case 'difficult':
                return puzzles[7].interact(i)
            case 'brain':
                return puzzles[7].interact(i)
        }
    }
};