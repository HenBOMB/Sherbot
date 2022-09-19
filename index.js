const fs = require("fs");

const mysql = require('mysql');

const { Collection, Client, GatewayIntentBits } = require('discord.js');

const { token, prefix, db_settings } = require('./config.json');

// // // // // // // // // // // // // // // // // // // // // //

const connection = mysql.createConnection(db_settings);

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages, 
		GatewayIntentBits.MessageContent, 
		GatewayIntentBits.GuildMessageReactions],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

client.interactions = [];

client.features = new Collection();

client.commands = new Collection();

const welcomes = fs.readFileSync("./data/welcomes.txt", 'utf8').split("\n");

const logError = (err) => {
	client.guilds.cache.get('643440133881856019').channels.cache.get('871211833837629521')
		.send(`<@348547981253017610>\n**An error occurred:** \`\`\`js\n${err}\`\`\``);
};

process.env.ownerid = '348547981253017610';
process.env.conn = connection;

// // // // // // // // // // // // // // // // // // // // // //

connection.connectasync (err => {
	if (err) throw err;

	console.clear();
	console.log("Connected to mysql server");

	connection.query("USE s134_batchbots", () => {
		console.log("Connected to database");
		console.log("\n\nSherbot");
	
		client.login(token).then(() => console.log(" ✓ Bot online"));
	});
});

// // // // // // // // // // // // // // // // // // // // // //

client.once('ready', async () => {
	client.user.setPresence({activities: [{ name: 'Sherlock', type: 'WATCHING'}], status: 'online' });

	// ? Load
	const feature_files = fs.readdirSync('./features').filter(file => file.endsWith('.js'));
	const command_files = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	const failed = [];
	let success = 0;

	// ? Initializing

	// ? Commands

	for (const file of command_files)
	{
		success++;

		const module = require(`./commands/${file}`);
		const name = file.slice(0,-3);

		module.name = name;

		try 
		{
			if(module.initialize()) client.interactions.push(name);
			console.log(` ✓ commands/${file}`);
		} 
		catch (err) 
		{
			failed.push(`${name}.js: ${err.toString()}`);
			console.log(` ✗ commands/${file}`);
		}

		client.commands.set(name, module);
	}

	// ? Features

	connection.query("SELECT * FROM sherbot WHERE id = '670107546480017409'", (err, res) => {
		for (const file of feature_files)
		{
			success++;
			try 
			{
				const module = require(`./features/${file}`);
				module.initialize(client.guilds.cache.get("670107546480017409"), connection, res[0]);
				client.features.set(file.slice(0,-3), module);
				console.log(` ✓ features/${file}`);
			} 
			catch (err) 
			{
				failed.push(`${file}: ${err.toString()}`);
				console.log(` ✗ features/${file}`);
			}
		}
			
		console.log(`Done initializing\nsuccess: ${success-failed.length}\nfailed: ${failed.length}\n- ${failed.join('\n- ')}`);
	});
});

client.on('guildMemberAdd', async member => {
	if(member.guild.id != '670107546480017409') return;
	
	const welcome = welcomes[Math.floor(Math.random() * welcomes.length)].replace(/{user}/g, member.user.username);
	const description = 
`:confetti_ball: Welcome ${member} to The Art of Deduction! :confetti_ball:
Head over to <#906149558801813605> to get verified!
Get started with dediction here <#679769341058744379> 👑`;
	
  	let th = 'th';
	const str = member.guild.memberCount.toString();
	if(str[str.length-1] == '1') th = 'st';
	else if(str[str.length-1] == '2') th = 'nd';
	else if(str[str.length-1] == '3') th = 'rd';

	

	const embed = new MessageEmbed().setColor(member.guild.members.cache.get('712429527321542777').roles.color.color)
		.setTitle(welcome)
		.setDescription(description)
		.setThumbnail(member.user.displayAvatarURL())
		.setTimestamp()
		.setFooter(`Joined as the ${member.guild.memberCount}${th} member`, member.user.displayAvatarURL());
	
	member.guild.channels.cache.get('670108784307470337').fetch().then(channel => {
		channel.send({ embeds: [embed] });
	});
})

client.on('messageCreate', async message =>{
    if(message.author.id == '712429527321542777') return;

	executeFeatures(message);

	executeCommands(message);
});

const ids = ['logic', 'what-am-i-riddles', 'who-is-it-riddles', 'who-am-i-riddles', 
			 'math-riddles', 'best-riddles', 'riddles-for-adults', 'difficult-riddles', 'brain-teasers']

client.on('interactionCreate', async (interaction) => {
    try{
		const arr = ids.filter(id => interaction.customId.includes(id));

		if(arr.length > 0)
		{
			// ! This is size 1 so loop cancels out
			for (const v of client.interactions)
				// client.commands.at(v).interact(arr[0], interaction); // Used at() because v was an int?
				client.commands.get(v).interact(arr[0], interaction);
		}
    }
    catch(err){
		logError(err);
    }
})

// // // // // // // // // // // // // // // // // // // // // //

function executeFeatures(message)
{
	try {
		client.features.each(feature => {
			if(!feature.tick) return;
			feature.tick(message);
		});
	} catch (err) {
		logError(err);
	}
}

function executeCommands(message)
{
	if(message.content.slice(0, prefix.length).toLowerCase() != prefix) 
		return;
	
	const cmd = message.content.slice(prefix.length).split(" ")[0].toLowerCase();
	
	message.content = message.content.slice(cmd.length + prefix.length + 1);

    client.commands.each(module => {
		if(!module.commands.includes(cmd)) 
			return;

		if(module.ids && !module.ids.includes(message.author.id))
			return;

		if(module.role && message.member.id !== process.env.ownerid && !message.member.roles.cache.has(module.role))
			return;

        if(module.flags)
        {
			executeCommandWithFlags(module, message);
		}
        else
		{
			const embed = new MessageEmbed().setColor(message.member.roles.color.color);
			const args = message.content?.trim().split(" ") || [];

			try {
				module.execute(message, embed, args, cmd);
			} catch (err) {
				try {
					module.execute(message, embed, args);
				} catch (err) { 
					logError(err);
				}
			}
		}
    })
}

function executeCommandWithFlags(module, message)
{
    try {
		const dms = message.channel.type == 'dm';
 
		if(dms && !module.flags.includes("dms")) 
			return;

		let mention = message.mentions.members.first();

		if(module.flags.includes("mention") && (mention === undefined || mention === null))
			return;
		
		const embed = new MessageEmbed().setColor(message.member.roles.color.color);
				
		if(module.flags.includes("noargs")) 
			module.execute(message, embed)
		else if(module.flags.includes("mention"))
			module.execute(message, embed, mention)
		else 
		{
			let args = message.content.trim().split(" ");
			if(!message.content) args = [];
			module.execute(message, embed, args)
		}
	} catch (err) {
		logError(err);
	}
}