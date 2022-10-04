const fs = require("fs");

const mysql = require('mysql');

const { Collection, Client, GatewayIntentBits, EmbedBuilder, Partials, Colors } = require('discord.js');

const { DiscordInteractions } = require("slash-commands");

const { token, publicKey, db_settings, db_name } = require('./config.json');

// ? // // // // // // // // // // // // // // // // // // // // //

const connection = mysql.createConnection(db_settings);

const client = new Client({
	intents: [
		GatewayIntentBits.MessageContent, 
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages, 
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const interaction = new DiscordInteractions({
	applicationId: "712429527321542777",
	authToken: token,
	publicKey,
});

client.interactions = [];

client.features = new Collection();

client.commands = new Collection();

const refreshSlashCommands = false;

const welcomes = fs.readFileSync("./data/welcomes.txt", 'utf8').split("\n");

process.logError = async (error) => { 
	const embed = new EmbedBuilder()
		.setTitle(error.name)
		.setDescription(`\`\`\`js\n${error.message}\`\`\`\n\`\`\`js\n${error.stack}\`\`\``)
		.setColor(Colors.Red)
		.setTimestamp();
	await process.logChannel.send({ content: '<@348547981253017610>' });
	process.logChannel.send({ embeds: [embed] });
};

process.logWarn = async (description) => { 
	const embed = new EmbedBuilder()
		.setTitle('Warning')
		.setDescription(description)
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

// ? // // // // // // // // // // // // // // // // // // // // //

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

	if(refreshSlashCommands)
	{
		const slashCommands = await interaction.getApplicationCommands(process.guild.id);
		await Promise.all(slashCommands.map(cmd => interaction.deleteApplicationCommand(cmd.id, process.guild.id)))
		console.log('\n! Refreshed slash commands');
	}

	console.log('\n! Commands');
	
	for (const file of command_files)
	{
		const command = require(`./commands/${file}`);
		const name = file.slice(0,-3);

		// ? Set the name to be the same as the script name
		command.name = name;

		try 
		{
			if(command.initialize && command.initialize(client)) 
				client.interactions.push(name);

			console.log(`   ✓ ${name}`);

			// ? Validate command
			if(command.interact === undefined)
			{
				console.log(`       ✗ interact not found`);
				continue;
			}

			// ? Validate slash command
			if(command.description === undefined)
			{
				console.log(`       ✗ description not found`);
				continue;
			}

			command.available = true;

			// ? Create slash command

			if(refreshSlashCommands)
			{
				// TODO This will get rate limited if abused
				await interaction
					.createApplicationCommand({
						name: command.name,
						description: command.description,
						options: command.options,
					}, command.guildid || process.guild.id)
					.then(cmd => {
						if(cmd.retry_after)
							console.log(`       ! ${cmd.message} (${cmd.retry_after})`);
						else if(cmd.errors)
							console.log(`       ✗ ${JSON.stringify(cmd.errors, null, 2)}`);
						else if(cmd.id)
							console.log(`       /${cmd.name} ${cmd.options? cmd.options.map(v => v.required?`[${v.name}]`:`(${v.name})`).join(' ') : ''}`);
						else
							console.log(`       ? ${cmd.message})`);
					})
					.catch(console.error);
			}
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
				if(module.initialize) module.initialize(process.guild, res[0]);
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

// ? // // // // // // // // // // // // // // // // // // // // //

client.on('guildMemberAdd', async member => {
	if(member.guild.id != process.guild.id) return;
	
	const th = (() => {
		switch (member.guild.memberCount.toString().slice(-1)) {
			case 1:  return 'st';
			case 2:  return 'nd';
			case 3:  return 'rd';
			default: return 'th';
		}
	})();

	const embed = new EmbedBuilder().setColor(member.guild.members.cache.get('712429527321542777').roles.color.color)
		.setTitle(welcomes[Math.floor(Math.random() * welcomes.length)].replace(/{user}/g, member.user.username))
		.setDescription(`🎊 Welcome ${member} to The Art of Deduction! 🎊\n Head on over to <#906149558801813605> to get verified!`)
		.setThumbnail(member.user.displayAvatarURL())
		.setTimestamp()
		.setFooter({
			text: `Joined as the ${member.guild.memberCount}${th} member`, 
			icon_url : member.user.displayAvatarURL()
		});
	
	member.guild.channels.cache.get('670108784307470337').fetch().then(channel => {
		channel.send({ embeds: [embed] });
	});
});

client.on('messageCreate', async message => {
    if(message.author.bot) return;
	if(message.author.id === process.ownerid && message.content.includes('preview'))
	{
		const channel = await message.member.user.createDM();
		const embed = new EmbedBuilder()
			.setTitle(`🎉 Welcome to the server ${message.member.user.username}! 🎉`)
			.setThumbnail(message.member.displayAvatarURL())
			.setDescription(`
ㅤ
*We're glad to have you* 💖

Introduce yourself~
• <#670108903224377354>

Say hi :wave:
• <#670111155263635476>

Some channels you might be interested in
▸ <#679769341058744379>
▸ <#714701731724001311>
▸ <#718905410442100787>
`)
			.setImage('https://media.discordapp.net/attachments/1018969696445403217/1026395223028404324/unknown.png')
			.setFooter({ text: message.guild.name })
			.setTimestamp();
		return await channel.send({ embeds: [embed] });
	}

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
	const sorryErrOcc = { content: '☹️ Sorry, an error occured. Please contact a <@&670114268858810369> or <@&742750595345022978>.', ephemeral: true };

	if(!client.commands.has(interaction.commandName))
	{
		// ! Impossible to get here unless api changes
		// ? Or if 2 interactions from separate places call the same interaction
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
	
	// ? Run the command interaction

	await interaction.deferReply({ephemeral: command.ephemeral});

	try {
		// TODO Theres a weird bug where if defer and ephmeral are true, then when returning an embed, it crashes.. (InteractionNotReplied)

		const out = (await command.interact(interaction));

		if(!out) 
		{
			await interaction.editReply(sorryErrOcc);
			return;
		}

		const options = out.content || out.embeds? out : { 
			content: out instanceof EmbedBuilder? '' : out, 
			embeds: out instanceof EmbedBuilder? [out] : []
		};

		options.ephemeral = command.ephemeral || out.ephemeral;

		await interaction.editReply(options);
	} 
	catch (error) {
		process.logError(error);
		await interaction.editReply(sorryErrOcc);
	} 
}