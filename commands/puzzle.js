const { 
    EmbedBuilder, Colors, 
    SlashCommandBuilder, 
} = require('discord.js');

const PuzzleLibrary = require('../scripts/puzzle_lib');

const puzzles = [];

const puzzleMap = {
    'logic-puzzles' : 10,
    'what-am-i-riddles' : 3,
    'who-is-it-riddles' : 3,
    'who-am-i-riddles' : 3,
    'math-riddles' : 17,
    'best-riddles' : 10,
    'riddles-for-adults' : 12,
    'difficult-riddles' : 17,
    'brain-teasers' : 29,
}

// ? https://www.ahapuzzles.com/

module.exports = {

    builder: new SlashCommandBuilder()
        .setName('puzzle')
        .setDescription('Get a random puzzle from 6+ different categories!')
        .setDMPermission(false)
        // ? puzzle (category)
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Category to choose from (optional)')
                .addChoices(
                    { name: 'Logic',        value: 'logic-puzzles'      },
                    { name: 'What am I?',   value: 'what-am-i-riddles'  },
                    { name: 'Who is it?',   value: 'who-is-it-riddles'  },
                    { name: 'What am I?',   value: 'who-am-i-riddles'   },
                    { name: 'Math',         value: 'math-riddles'       },
                    { name: 'Best',         value: 'best-riddles'       },
                    { name: 'Adult',        value: 'riddles-for-adults' },
                    { name: 'Difficult',    value: 'difficult-riddles'  },
                    { name: 'Brain Teaser', value: 'brain-teasers'      },
                )
        )
    ,
   
    initialize()
    {
        for (const key in puzzleMap)
            puzzles.push(new PuzzleLibrary(key, new EmbedBuilder().setColor(Colors.Orange), puzzleMap[key]));
    },

	async interact({ options }) 
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

    async buttonPress(interaction) 
    {
        await puzzles[Object.keys(puzzleMap).indexOf(interaction.customId.split(':')[0])].interact(interaction);
    }
};