const fs = require("fs");

const clone = false;

// // // // // // // // // // // // // // // // // // // // // //

const { Collection, Client, Intents } = require('discord.js');

const { token, prefix } = require('./config.json');

const { RandomItem } = require("../tools/random.js");

const { GenericEmbed }  = require("../tools/utils.js");

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS, 
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES, 
		Intents.FLAGS.GUILD_VOICE_STATES, 
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

// // // // // // // // // // // // // // // // // // // // // //

const interactions = new Collection();

client.features = new Collection();

client.commands = new Collection();

client.music = new Collection();

// // // // // // // // // // // // // // // // // // // // // //

const welcomes = fs.readFileSync("./sherbot/data/welcomes.txt", 'utf8').split("\n");

// set externally
var connection;

module.exports = {
	initialize : function(con)
	{
		connection = con;
		client.login(token);
	}
}

// // // // // // // // // // // // // // // // // // // // // //

client.once('ready', async () => {
	console.log("\nSherbot ->");
	client.user.setPresence({activities: [{ name: 'Sherlock', type: 'WATCHING'}], status: 'online' });

	// Load the files
	const feature_files = fs.readdirSync('./sherbot/features').filter(file => file.endsWith('.js') && !file.includes('util'));
	const command_files = fs.readdirSync('./sherbot/commands').filter(file => !file.includes('util'));
	const paths = new Collection();
	const guild = client.guilds.cache.get("670107546480017409");

	for (const file of command_files)
	{
		if(!file.endsWith('.js'))
		{
			const command_sub_files = fs.readdirSync('./sherbot/commands/'+file).filter(file => file.endsWith('.js') && !file.includes('util'));

			for (const subfile of command_sub_files)
			{
				const name = subfile.slice(0,-3);
				client.commands.set(name, require(`./commands/${file}/${subfile}`));
				client.commands.get(name).name = name;
				if(clone)
					client.commands.get(name).commands[0] = client.commands.get(name).commands[0]+"_";
				paths.set(name, `./commands/${file}/${subfile}`);
			}
			continue;
		}

		const name = file.slice(0,-3);
		client.commands.set(name, require(`./commands/${file}`));
		client.commands.get(name).name = name;
		if(clone)
			client.commands.get(name).commands[0] = client.commands.get(name).commands[0]+"_";
		paths.set(name, `./commands/${file}`);
	}

	// Initialize the files

	console.log('- loaded ./sherbot/data/welcomes.txt');

	connection.query("SELECT * FROM sherbot WHERE id = 670107546480017409", (err, res) => {
		res = res[0];

		// Load the Commands
		let i = 0;
		client.commands.forEach(module => {
			const val = module.initialize(client, connection, res);
			if(val === true)
				interactions.set(module.name, i)
			console.log(`- init ${paths.get(module.name)}`)
			i++;
		});

		// Load the Features

		for (const file of feature_files)
		{
			const feature = require(`./features/${file}`);
			feature.initialize(guild, connection, res);
			client.features.set(file.slice(0,-3), feature);
			console.log(`- init ./features/${file}`);
		}

		// Done

		if(clone)
			console.log("- bot online (clone)")
		else
			console.log("- bot online");
	});
});

client.on('guildMemberAdd', async member => {
	if(clone || member.guild.id != '670107546480017409') return;
	
	let welcome = RandomItem(welcomes);
	welcome = welcome.replace(/{user}/g, member.user.username);

	let description = 
`:confetti_ball: Welcome ${member} to The Art of Deduction! :confetti_ball:
Head over to <#679769341058744379> to learn deduction!
View other's deductions at <#852185225432793108> :mag:`;
	
  	let th = 'th';
	const str = member.guild.memberCount.toString();
	if(str[str.length-1] == '1') th = 'st';
	else if(str[str.length-1] == '2') th = 'nd';
	else if(str[str.length-1] == '3') th = 'rd';

	const bot = member.guild.members.cache.get('712429527321542777');
	const embed = GenericEmbed(bot)
		.setTitle(welcome)
		.setDescription(description)
		.setThumbnail(member.user.displayAvatarURL())
		.setTimestamp()
		.setFooter(`Joined as the ${member.guild.memberCount}${th} member`, member.user.displayAvatarURL());
	
	member.guild.channels.cache.get('670108784307470337').fetch().then(channel => {
		channel.send({ embeds: [embed] })
	});
})

client.on('messageCreate', async message =>{
    if(message.author.id == '712429527321542777') 
		return;

	client.features.each(feature => {
		if(feature.tick == undefined) return;
		feature.tick(message);
	});

	ExecuteCommands(message);
});

const ids = ['logic', 'what-am-i-riddles', 'who-is-it-riddles', 'who-am-i-riddles', 
			 'math-riddles', 'best-riddles', 'riddles-for-adults', 'difficult-riddles']

client.on('interactionCreate', async (interaction) => {
	interactions.each(async (value, key) => {
		ids.forEach(id => {
			if(interaction.customId.includes(id))
				client.commands.at(value).interact(id, interaction);
		});
	});
})

// // // // // // // // // // // // // // // // // // // // // //

function ExecuteCommands(message)
{
	if(message.content.slice(0, prefix.length).toLowerCase() != prefix) 
		return;
	
	let cmd = message.content.slice(prefix.length).split(" ")[0].toLowerCase();
	
	message.content = message.content.slice(cmd.length + prefix.length + 1);

    client.commands.each(module => 
	{
		if(!module.commands.includes(cmd)) 
			return;

		if(module.ids !== undefined && !module.ids.includes(message.author.id))
			return;

		if(module.role !== undefined && message.member.id !== process.env.ownerid)
		{
			if(!message.member.roles.cache.has(module.role))
				return;
		}

        if(module.flags !== undefined)
            ExecuteCommandWithFlags(module, message);
        else
		{
			let embed = GenericEmbed(message.member);

			let args = message.content.trim().split(" ");
			if(message.content === '') args = [];
			try {
				module.execute(message, embed, args, cmd);
			} catch (error) {
				module.execute(message, embed, args);
			}
		}
    })
}

function ExecuteCommandWithFlags(module, message)
{
    const dms = message.channel.type == 'dm';
 
    if(dms && !module.flags.includes("dms")) 
		return;

    let mention = message.mentions.members.first();

	if(module.flags.includes("mention") && (mention === undefined || mention === null))
		return;
    
	let embed = GenericEmbed(message.member);
            
    if(module.flags.includes("noargs")) 
		module.execute(message, embed)
    else if(module.flags.includes("mention"))
		module.execute(message, embed, mention)
	else 
	{
		let args = message.content.trim().split(" ");
		if(message.content === '') args = [];
		module.execute(message, embed, args)
	}
}