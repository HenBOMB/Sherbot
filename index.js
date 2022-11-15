const {
	readFileSync, 
	readdirSync 
} = require("fs");

const { 
	Collection, 
	Client, 
	GatewayIntentBits, 
	EmbedBuilder, 
	Partials, 
	Colors, 
	REST, 
	Routes 
} = require('discord.js');

const { 
	token, 
	dbSettings, 
	dbName, 
	localDir, 
	guildId, 
	clientId 
} = require('./config.json');

const mysql = require('mysql');

const client = new Client({
	intents: [
		GatewayIntentBits.MessageContent, 
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages, 
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages
	],
	partials: [
		Partials.Message, 
		Partials.Channel, 
		Partials.Reaction
	],
});

const rest = new REST({ version: '10' }).setToken(token);

// ? // // // // // // // // // // // // // // // // // // // // //

const connection = mysql.createConnection(dbSettings);

connection.connect((err, args) => {
	if (err) throw err;

	console.clear();

	process.conn = connection;

	connection.query(`USE ${dbName}`, () => {
		console.log("Sherbot");
		client.login(token).then(() => console.log("> Bot online"));
	});
});

// ? // // // // // // // // // // // // // // // // // // // // //

process.log = async (title, description, color = Colors.Orange, message = null) => { 
	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor(color);
	if(message) return message.reply({ embeds: [embed] });
	process.logChannel.send({ embeds: [embed] });
};

process.logWarn = async (description) => { 
	const embed = new EmbedBuilder()
		.setTitle('Warning')
		.setDescription(description)
		.setColor(Colors.Yellow);
	process.logChannel.send({ embeds: [embed] });
};

process.logError = async (error, message=null, pull=false) => {

	if(!error || (!error.code && !error.stack && !error.errno && !error.sqlMessage)) 
	{
		return;
	}

	if(process.catchErrorLogs)
	{
		process.catchErrorLogs.push(error);
		return;
	}

	const isMsg = message && message.content && message.reply;
	const reg = new RegExp(localDir, 'gm');

	let stack;

	try {
		throw new Error('');
	}
	  catch (error) {
		stack = error.stack || '';
	}

	const embed = new EmbedBuilder()
		.setColor(Colors.Red)
		.setDescription(
`
**${error.errno? 'SQL' : ''} ${error.code || error.name}** ${error.errno? `(${error.errno})` : ''}
\`\`\`js
${((error.message || error.sqlMessage).replace(reg,'')).slice(0, 1500)}
\`\`\`
**Stack**
\`\`\`js
${((error.stack || error.sql).replace(reg,'')).slice(0, 1500)}
\`\`\``);
// **Trace**
// \`\`\`js
// ${(stack.replace(reg,'').split('\n').slice(2).join('\n')).slice(0, 900)}
// \`\`\`
// `);
	if(isMsg) 
	{
		return message.reply({ embeds: [embed] });
	}

	if(pull)
	{
		return { embeds: [embed] };
	}

	await process.logChannel.send({ content: '<@348547981253017610>' });
	return process.logChannel.send({ embeds: [embed] });
};

// ? // // // // // // // // // // // // // // // // // // // // //

client.once('ready', async () => {

	// ? Set variables

	client.features = new Collection();
	client.commands = new Collection();

	process.botColor = '12386304';
	process.ownerId = '348547981253017610';
	process.guild = await client.guilds.fetch(guildId);
	process.logChannel = await process.guild.channels.fetch('1026319776630456421');

	// client.user.setPresence({activities: [{ name: 'Sherlock', type: 'WATCHING'}], status: 'online' });

	// ? Initializing

	const feature_files = readdirSync('./features').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	
	console.log('\n> Features');

	for (const file of feature_files)
	{
		const name = file.slice(0,-3);
		
		try 
		{
			const feature = require(`./features/${file}`);

			if(feature.initialize)
			{
				await feature.initialize(client);
			}

			client.features.set(name, feature);

			console.log(`   ✓ ${name}`);
		} 
		catch (err) 
		{
			console.log(`   ✗ ${name}`);
			console.log(`      ${err.toString()}`)
		}
	}

	console.log('\n> Commands');
	
	const slashCommands = {};
	const command_files = readdirSync('./commands').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	const registerSlashCommands = process.argv.includes('--refresh');

	for (const file of command_files)
	{
		const command = require(`./commands/${file}`);
		const name = file.slice(0,-3);

		client.commands.set(name, command);

		try 
		{
			if(command.initialize) 
			{
				await command.initialize(client);
			}

			console.log(`   ✓ ${name}`);

			// ? Validate command
			if(command.interact === undefined)
			{
				console.log(`       ✗ interact not found`);
			}

			// ? Validate slash command
			if(!command.builder && !command.builders)
			{
				console.log(`       ✗ builder not found`);
			}

			if(command.interact === undefined || (!command.builder && !command.builders))
			{
				continue;
			}

			if(command.available === false)
			{
				console.log(`       ✗ unavailable`);
				continue;
			}

			command.available = true;

			// ? Register slash command

			if(registerSlashCommands)
			{
				const ids = command.guildIds || [ command.guildId || 'global' ];
				const builders = command.builders || [ command.builder ];

				if(builders.length > 1)
				{
					client.commands.delete(name);
				}

				builders.forEach(builder => {
					client.commands.set(builder.name, command);
					ids.forEach(id => {
						slashCommands[id] = slashCommands[id] || [];
						slashCommands[id].push(builder.toJSON());
					});
				});
			}
		} 
		catch (err) 
		{
			console.log(`   ✗ ${name}`);
			console.log(`      ${err.toString()}`)
		}
	}

	if(registerSlashCommands)
	{
		for (const key in slashCommands) 
		{
			if(key === 'global')
			{
				await rest
					.put(Routes.applicationCommands(clientId), { body: slashCommands[key] })
					.then((data) => {
						const mapped = data.map(({name, options}) => `   /${name} (${options.map(o => o.name).join(', ')})`);
						console.log(`\n> Registered global slash command${data.length>1?'s':''}`);
						console.log(mapped.join('\n'));
					})
					.catch(err => console.log(JSON.stringify(err, null, 2)));
			}
			else
			{
				await rest
					.put(Routes.applicationGuildCommands(clientId, key), { body: slashCommands[key] })
					.then(async (data) => {
						const guild = await client.guilds.fetch(key);
						const mapped = data.map(({name, options}) => `   /${name} (${options.map(o => o.name).join(', ')})`);
						console.log(`\n> Registered ${guild.name} slash command${data.length>1?'s':''}`);
						console.log(mapped.join('\n'));
					})
					.catch(err => console.log(JSON.stringify(err, null, 2)));
			}
		}
	}

	console.log('\n> Finished');
});

// ? // // // // // // // // // // // // // // // // // // // // //

client.on('guildMemberAdd', async member => {
	if(member.guild.id != process.guild.id) return;
	
	await member.roles.add('670108333834764288');

	const th = (() => {
		switch (member.guild.memberCount.toString().slice(-1)) {
			case 1:  return 'st';
			case 2:  return 'nd';
			case 3:  return 'rd';
			default: return 'th';
		}
	})();

	const welcomes = readFileSync("./data/welcomes.txt", 'utf8').split("\n");
	const channel = await member.guild.channels.cache.get('670108784307470337').fetch();

	await channel.send({ embeds: [
		new EmbedBuilder()
			.setColor(process.botColor)
			.setTitle(welcomes[Math.floor(Math.random() * welcomes.length)].replace(/{user}/g, member.user.username))
			.setDescription(`🎊 Welcome ${member} to The Art of Deduction!`)
			.setThumbnail(member.user.displayAvatarURL())
			.setTimestamp()
			.setFooter({
				text: `Joined as the ${member.guild.memberCount}${th} member`, 
				icon_url : member.user.displayAvatarURL()
			})
		]
	});

	// ? Send verif required message to dms

	await member.user.send({ embeds: [
		new EmbedBuilder()
			.setTitle(`Verification Required`)
			.setThumbnail('https://cdn-icons-png.flaticon.com/512/1779/1779281.png')
			.setDescription(`
🗝️ Head over to <#906149558801813605> to verify yourself.

**You must answer the following questions:**

> 1. Have you read the <#714956060427026533>?
> 2. Why are you interested in deduction? 
> 3. How long have you been practicing deduction? 
> 4. What is your favorite field of study?
> 5. What is your purpose of joining this server?

[Click here for more info](https://discord.com/channels/670107546480017409/906149558801813605/906150446966648882)
ㅤ
`)
			.setFooter({ text: member.guild.name })
			.setTimestamp()
	]});
});

client.on('messageCreate', async message => {
    if(message.author.bot) return;

	if(message.channel.isDMBased())
	{
		// if(message.author.username !== 'Hen')
		// {
		// 	return;
		// }

		return;
	}

	// console.log(`${message.author.username}: ${message.content}`);
	
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
	if(process.argv.includes('--maintenence') && interaction.member.id !== process.ownerId)
		return interaction.reply({ content: 'Sorry, Sherbot is currently under maintenence. Try again later.', ephemeral: true })

	if(interaction.isChatInputCommand())
		return handleSlashCommands(interaction);

	if(interaction.isAutocomplete())
		return handleAutocomplete(interaction);

	if(interaction.isButton())
		return handleButton(interaction);

	return interaction.reply(sorryErrOcc);
});

// ? // // // // // // // // // // // // // // // // // // // // //

const sorryErrOcc = { content: '☹️ Sorry, an error occured. Please try again later.', ephemeral: true };

const sorryUnavailable = { content: `☹️ Sorry, this command is currently unavailable. Please try again later.`, ephemeral: true };

async function handleAutocomplete(interaction)
{
	const command = client.commands.get(interaction.commandName);

	const out = await command.handleAutocomplete(interaction);

	if(!out)
	{
		out = [{
			name: '☹️ Failed to load suggestions, try again later.',
			value: 'error',
		}]
	}

	interaction.respond(out);
}

async function handleSlashCommands(interaction)
{
	const command = client.commands.get(interaction.commandName);

	if(!command)
	{
		return interaction.reply({ content: `☹️ Sorry, that command does not exist.`, ephemeral: true });
	}

	if(!command.available)
	{
		return interaction.reply(sorryUnavailable);
	}

	// ? Run the command interaction

	await interaction.deferReply({ ephemeral: command.ephemeral || false });

	try {
		const out = (await command.interact(interaction));

		if(!out) 
		{
			await interaction.editReply(sorryUnavailable);
			return;
		}

		const options = out.content || out.embeds? out : { 
			content: out instanceof EmbedBuilder? '' : out, 
			embeds: out instanceof EmbedBuilder? [out] : []
		};

		options.ephemeral = command.ephemeral || out.ephemeral || false;

		await interaction.editReply(options);
	} 
	catch (error) {
		process.logError(error);
		await interaction.editReply(sorryErrOcc);
	} 
}

async function handleButton(interaction) {
	const [ type ] = interaction.customId.split('*');
	
	switch (type) {
		case 'cmd':
			return handleButtonCommand(interaction)
	
		default:
			return interaction.reply(sorryErrOcc);
	}
}

async function handleButtonCommand(interaction)
{
	const [ , id ] = interaction.customId.split('*');

	const command = client.commands.get(id);

	if(!command)
	{
		return interaction.reply(sorryErrOcc);
	}

	if(!command.available)
	{
		return interaction.reply(sorryUnavailable);
	}

	await interaction.deferReply({ ephemeral: (command.isButtonEphemeral && command.isButtonEphemeral(interaction)) || false });

	try {
		const out = await command.buttonPress(interaction);

		if(!out) 
		{
			await interaction.editReply(sorryUnavailable);
			return;
		}

		const options = out.content || out.embeds? out : { 
			content: out instanceof EmbedBuilder? '' : out, 
			embeds: out instanceof EmbedBuilder? [out] : []
		};

		options.ephemeral = command.ephemeral || out.ephemeral || false;

		await interaction.editReply(options);
	} 
	catch (error) {
		process.logError(error);
		await interaction.editReply(sorryErrOcc);
	} 
}
