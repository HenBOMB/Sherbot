const fs = require("fs");

const mysql = require('mysql');

const { Collection, Client, GatewayIntentBits, EmbedBuilder, Colors } = require('discord.js');

const { DiscordInteractions } = require("slash-commands");

const { token, publicKey, db_settings, db_name } = require('./config.json');

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

const interaction = new DiscordInteractions({
	applicationId: "712429527321542777",
	authToken: token,
	publicKey,
});

client.interactions = [];

client.features = new Collection();

client.commands = new Collection();

const welcomes = fs.readFileSync("./data/welcomes.txt", 'utf8').split("\n");

process.logError = async (error) => { 
	const embed = new EmbedBuilder()
		.setTitle(error.name)
		.setDescription(`\`\`\`js\n${error.message}\`\`\`\n\`\`\`js\n${error.stack}\`\`\``)
		.setColor(Colors.Red)
		.setTimestamp();
	await channel.send({ content: '<@348547981253017610>' });
	process.logChannel.send({ embeds: [embed] });
};

process.logWarn = async (description) => { 
	const embed = new EmbedBuilder()
		.setTitle('Warning')
		.setDescription(`${description}\nin: <#${channel.name}>`)
		.setColor(Colors.Yellow)
		.setTimestamp();
	process.logChannel.send({ embeds: [embed] });
};

process.log = async (title, description, color = Colors.Orange) => { 
	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor(color)
		.setTimestamp();
	process.logChannel.send({ embeds: [embed] });
};

// // // // // // // // // // // // // // // // // // // // // //

connection.connect((err, args) => {
	if (err) throw err;

	console.clear();
	console.log("Connected to mysql server");

	process.conn = connection;

	connection.query(`USE ${db_name}`, () => {
		console.log("Connected to database");
		console.log("\n\nSherbot");
		client.login(token).then(() => console.log(" ✓ Bot online"));
	});
});

client.once('ready', async () => {
	// ? Set env variables

	process.ownerid = '348547981253017610';
	process.guild = await client.guilds.fetch('670107546480017409');
	process.logChannel = await process.guild.channels.fetch('1026319776630456421');

	client.user.setPresence({activities: [{ name: 'Sherlock', type: 'WATCHING'}], status: 'online' });

	// ? Load
	const feature_files = fs.readdirSync('./features').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	const command_files = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	const failed = [];

	// ? Delete all existing slash commands

	const slashCommands = await interaction.getApplicationCommands(process.guild.id);
	await Promise.all(slashCommands.map(cmd => interaction.deleteApplicationCommand(cmd.id, process.guild.id)))

	console.log('\n! Commands');
	
	for (const file of command_files)
	{
		const command = require(`./commands/${file}`);
		const name = file.slice(0,-3);

		// ? Set the name to be the same as the script name
		command.name = name;

		// ? Validate command
		if(!command.interact)
		{
			console.log(`       ✗ interact not found`);
			continue;
		}

		// ? Validate slash command
		if(!command.description)
		{
			console.log(`       ✗ description not found`);
			continue;
		}

		try 
		{
			if(command.initialize && command.initialize(client)) 
				client.interactions.push(name);

			console.log(`   ✓ ${name}`);

			command.available = true;

			// ? Create slash command

			// TODO This may get rate limited
			await interaction
				.createApplicationCommand({
					name: command.name,
					description: command.description,
					options: command.options,
				}, process.guild.id)
				.then(cmd => {
					if(cmd.retry_after)
						console.log(`       ${cmd.message} (${cmd.retry_after})`);
					else if(cmd.errors)
						console.log(cmd.errors);
					else if(cmd.id)
						console.log(`       /${cmd.name} ${cmd.options.map(v => v.required?`[${v.name}]`:`(${v.name})`).join(' ')}`);
				})
				.catch(console.error);
		} 
		catch (err) 
		{
			failed.push(`${name}.js: ${err.toString()}`);
			console.log(`   ✗ ${name}`);
		}

		client.commands.set(name, command);
	}

	console.log('\n! Features');

	connection.query(`SELECT * FROM sherbot WHERE id = '${process.guild.id}'`, (err, res) => {
		for (const file of feature_files)
		{
			const name = file.slice(0,-3);
			try 
			{
				const module = require(`./features/${file}`);
				if(module.initialize) module.initialize(client.guilds.cache.get(process.guild.id), res[0]);
				client.features.set(name, module);
				console.log(`   ✓ ${name}`);
			} 
			catch (err) 
			{
				failed.push(`${file}: ${err.toString()}`);
				console.log(`   ✗ ${name}`);
			}
		}

		console.log('\nFinished')
		console.log(`${failed.length?'-':''} ${failed.join('\n- ')}`);
	});
});

// // // // // // // // // // // // // // // // // // // // // //

client.on('guildMemberAdd', async member => {
	if(member.guild.id != process.guild.id) return;
	
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

	const embed = new EmbedBuilder().setColor(member.guild.members.cache.get('712429527321542777').roles.color.color)
		.setTitle(welcome)
		.setDescription(description)
		.setThumbnail(member.user.displayAvatarURL())
		.setTimestamp()
		.setFooter(`Joined as the ${member.guild.memberCount}${th} member`, member.user.displayAvatarURL());
	
	member.guild.channels.cache.get('670108784307470337').fetch().then(channel => {
		channel.send({ embeds: [embed] });
	});
});

client.on('messageCreate', async message =>{
    if(message.author.bot) return;

	client.features.each(feature => {
		if(!feature.tick) return;
		try {
			feature.tick(message);
		} catch (error) {
			process.logError(error);
		}
	});
});

client.on('interactionCreate', async (interaction) => {

	if (interaction.isChatInputCommand())
		return handleSlashCommands(interaction);

	// ? Handle button presses
	// TODO This is dodgy

    try {
		const arr = ['logic', 'what-am-i-riddles', 'who-is-it-riddles', 'who-am-i-riddles', 'math-riddles', 'best-riddles', 'riddles-for-adults', 'difficult-riddles', 'brain-teasers']
			.filter(id => interaction.customId.includes(id));

		if(arr.length > 0)
		{
			for (const v of client.interactions)
				client.commands.get(v).buttonPress(arr[0], interaction);
		}
    }
    catch(error) {
		process.logError(error);
    }
});

async function handleSlashCommands(interaction)
{
	if(!client.commands.has(interaction.commandName))
	{
		// ! Impossible to get here unless api changes
		return interaction.reply({ content: `☹️ Sorry, that command does not exist.`, ephemeral: true });
	}

	const command = client.commands.get(interaction.commandName);

	if(!command.available)
	{
		return interaction.reply({ content: `☹️ Sorry, this command is currently unavailable. Please try again later!`, ephemeral: true });
	}

	if(command.roles && !interaction.member.roles.cache.hasAny(...command.roles))
	{
		return interaction.reply({ content: `☹️ Sorry! Only ${command.roles.map(v => interaction.member.guild.roles.cache.get(v)).join(', ')} may use this command.`, ephemeral: true });
	}
	
	try {
		if(command.defer) interaction.deferReply({ephemeral: command.ephemeral});

		const out = (await command.interact(interaction)) || { content: '☹️ Sorry, an error occured. Please try again later!', ephemeral: true};
		const options = out.content || out.embeds? out : { 
			content: out instanceof EmbedBuilder? '' : out, 
			embeds: out instanceof EmbedBuilder? [out] : []
		};

		options.ephemeral = command.ephemeral || out.ephemeral;
		
		console.log(options);

		if(command.defer) interaction.followUp(options);
		else interaction.reply(options);
	} catch (error) {
		process.logError(error);
	}
}