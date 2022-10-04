const { EmbedBuilder, Colors } = require('discord.js');
const PuzzleLibrary = require('../scripts/puzzle_lib');

const puzzles = [];

// ? https://www.ahapuzzles.com/

module.exports =
{
    description: "Get a random puzzle!",

    options: [
        {
            type: 3,
            name: "category",
            description: "Puzzle type",
            choices: [
                {
                    name: "Riddle",
                    value: "riddle"
                },
                {
                    name: "Teaser",
                    value: "teaser"
                },
                {
                    name: "Math",
                    value: "math"
                },
                {
                    name: "What am I?",
                    value: "whatami"
                },
                {
                    name: "Who is it?",
                    value: "whoisit"
                },
                {
                    name: "Who Am I?",
                    value: "whoami"
                }
            ]
        }
    ],

    initialize : function()
    {
        const embed = new EmbedBuilder().setColor(Colors.Orange);
        
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

	interact : async function ({ options }) 
    {
        switch (options.getString('category') || 'puzzle') {
            default:
                return puzzles[Math.floor(Math.random() * 8)].fetch();
            case 'whatami':
                return puzzles[1].fetch();
            case 'whoisit':
                return puzzles[2].fetch();
            case 'whoami':
                return puzzles[3].fetch();
            case 'math':
                return puzzles[4].fetch();
            case 'riddle':
                return puzzles[Math.floor(Math.random() * 2)+5].fetch();
            case 'teaser':
                return puzzles[8].fetch();
        }
    },

    buttonPress : function(cmd, i) 
    {
        cmd = cmd.split('-')[0];
        switch (cmd) {
            case 'logic':
                return puzzles[0].interact(i)
            case 'what':
                return puzzles[1].interact(i)
            case 'who':
                return puzzles[2].interact((cmd.split('-')[1] !== 'is') + 2);
                // if(cmd.split('-')[1] === 'is') return puzzles[2].interact(i)
                // else return puzzles[3].interact(i)
            case 'math':
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