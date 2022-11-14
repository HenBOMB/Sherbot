const { 
    SlashCommandBuilder,
} = require('discord.js');

const PuzzleLibrary = require('../scripts/puzzle-library');

const puzzleLib = new PuzzleLibrary('riddle');

module.exports = {
    builder: new SlashCommandBuilder()
        .setName('riddle')
        .setDescription('Do you think you’re observant enough to solve these tough riddles?')
        .setDMPermission(false)
        // ? riddle (category)
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Category to choose from (optional)')
                .addChoices(...Object.keys(puzzleLib.config).map(key => {
                    return {
                        name: key[0].toUpperCase() + key.replace(/-/g, ' ').slice(1).toLowerCase(),
                        value: key,
                    }
                }))
        )
    ,

	async interact({ options }) 
    {
        return puzzleLib.embed(await puzzleLib.fetch(options && options.getString('category')));
    },

    async buttonPress(interaction) 
    {
        if(interaction.customId.includes('more'))
            return puzzleLib.embed(await puzzleLib.fetch(interaction.customId.split(':')[1]));

        return puzzleLib.embed(await puzzleLib.get(interaction.customId));
    },

    isButtonEphemeral(interaction) 
    {
        return !interaction.customId.includes('more');
    }
};