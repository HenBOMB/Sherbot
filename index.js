const { readFileSync, readdirSync } = require("fs");

const mysql = require('mysql');

const { Collection, Client, GatewayIntentBits, EmbedBuilder, Partials, Colors, REST, Routes } = require('discord.js');

const { token, dbSettings, dbName, localDir, guildId, clientId } = require('./config.json');

// ? // // // // // // // // // // // // // // // // // // // // //

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

const connection = mysql.createConnection(dbSettings);

const is_maintenence = process.argv.includes('--maintenence');

const rest = new REST({ version: '10' }).setToken(token);

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

connection.connect((err, args) => {
	if (err) throw err;

	console.clear();
	console.log("Connected to mysql server");

	process.conn = connection;

	connection.query(`USE ${dbName}`, () => {
		console.log("Connected to database");
		console.log("\n\nSherbot");
		client.login(token).then(() => console.log(" ✓ Bot online"));
	});
});

client.once('ready', async () => {

	// ? Set variables

	client.features = new Collection();
	client.commands = new Collection();

	process.ownerId = '348547981253017610';
	process.guild = await client.guilds.fetch(guildId);
	process.logChannel = await process.guild.channels.fetch('1026319776630456421');

	// client.user.setPresence({activities: [{ name: 'Sherlock', type: 'WATCHING'}], status: 'online' });

	// ? Initializing

	const feature_files = readdirSync('./features').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	
	console.log('\n! Features');

	for (const file of feature_files)
	{
		const name = file.slice(0,-3);
		try 
		{
			const module = require(`./features/${file}`);
			if(module.initialize) await module.initialize();
			client.features.set(name, module);
			console.log(`   ✓ ${name}`);
		} 
		catch (err) 
		{
			console.log(`   ✗ ${name}`);
			console.log(`      ${err.toString()}`)
		}
	}

	console.log('\n! Commands');
	
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
					console.log(`       / ${builder.name}`);
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
					.then((data) => console.log(`\n! Registered ${data.length} global slash commands`))
					.catch(err => console.log(JSON.stringify(err, null, 2)));
			}
			else
			{
				await rest
					.put(Routes.applicationGuildCommands(clientId, key), { body: slashCommands[key] })
					.then((data) => console.log(`\n! Registered ${data.length} guild slash commands`))
					.catch(err => console.log(JSON.stringify(err, null, 2)));
			}
		}
	}

	// ! Bots cannot use this endpoint (20001)
	// await rest
	// 	.put(Routes.guildApplicationCommandsPermissions(clientId, '643440133881856019', '1026656658400747552'), { body: 
	// 		{
	// 			"permissions": [
	// 				{
	// 					"id": "745778163740835920",
	// 					"type": 1,
	// 					"permission": false
	// 				}
	// 			]
	// 		}	
	// 	})
	// 	.then((data) => console.log(`\n! Set ${data.length} command permissions.`))
	// 	.catch(console.error);

	console.log('\n ! Finished');
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
	
	// TODO
	if(message.author.id === process.ownerId && message.content.includes('preview'))
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
	if(is_maintenence && interaction.member.id !== process.ownerId)
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
const Houses = require("./scripts/houses");

const sorryErrOcc = { content: '☹️ Sorry, an error occured. Please try again later.', ephemeral: true };

const sorryUnavailable = { content: `☹️ Sorry, this command is currently unavailable. Please try again later.`, ephemeral: true };

async function handleAutocomplete(interaction)
{
	switch (interaction.commandName) 
	{
		// TODO embed this in the command itself, like the other 2 handlers

		case 'house':
			return interaction.respond(
				(await Houses.getNames())
				.filter(name => name.includes(interaction.options.getFocused()))
				.map(name => ({
					name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
					value: name,
				}))
			);
		case 'rr':
			return interaction.respond(
				Object
					.keys(process.reactionRoles)
					.filter(choice => choice.includes(interaction.options.getFocused()))
					.map(choice => ({
						name: choice,
						value: choice,
					}))
			);
	}

	return [{
		name: sorryErrOcc.content,
		value: '',
	}]
}

async function handleSlashCommands(interaction)
{
	const command = client.commands.get(interaction.commandName);

	if(!command)
	{
		// ! Impossible to get here unless
		// ? The api changes
		// ? There is an unregistered command
		// ? If 2 interactions from separate places call the same interaction?
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
