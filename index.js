const fs = require("fs");

const mysql = require('mysql');

const { Collection, Client, GatewayIntentBits, EmbedBuilder, Partials, Colors, REST, Routes } = require('discord.js');

const { token, dbSettings, dbName, appId, guildId, clientId } = require('./config.json');

// ? // // // // // // // // // // // // // // // // // // // // //

const connection = mysql.createConnection(dbSettings);

const rest = new REST({ version: '10' }).setToken(token);

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

// ? // // // // // // // // // // // // // // // // // // // // //

client.buttons = new Collection();

client.features = new Collection();

client.commands = new Collection();

const registerSlashCommands = false;

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

	connection.query(`USE ${dbName}`, () => {
		console.log("Connected to database");
		console.log("\n\nSherbot");
		client.login(token).then(() => console.log(" ✓ Bot online"));
	});
});

client.once('ready', async () => {
	// ? Set env variables

	process.ownerid = '348547981253017610';
	process.guild = await client.guilds.fetch(guildId);
	process.logChannel = await process.guild.channels.fetch('1026319776630456421');

	// client.user.setPresence({activities: [{ name: 'Sherlock', type: 'WATCHING'}], status: 'online' });

	// ? Initializing

	const feature_files = fs.readdirSync('./features').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	
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
	const command_files = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	
	for (const file of command_files)
	{
		const command = require(`./commands/${file}`);
		const name = file.slice(0,-3);

		client.commands.set(name, command);

		try 
		{
			if(command.initialize) await command.initialize(client)

			console.log(`   ✓ ${name}`);

			// ? Validate command
			if(command.interact === undefined)
			{
				console.log(`       ✗ interact not found`);
			}

			// ? Validate slash command
			if(!command.data)
			{
				console.log(`       ✗ data not found`);
			}

			if(command.interact === undefined || !command.data)
			{
				continue;
			}

			command.available = true;

			// ? Register slash command

			if(registerSlashCommands)
			{
				const id = command.guildId || guildId;
				slashCommands[id] = slashCommands[id] || [];
				slashCommands[id].push(command.data.toJSON());
				console.log(`       / ${command.data.name}`);
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
		for (const key in slashCommands) {
			await rest
				.put(Routes.applicationGuildCommands(clientId, key), { body: slashCommands[key] })
				.then((data) => console.log(`\n! Registered ${data.length} slash commands`))
				.catch(err => console.log(JSON.stringify(err, null, 2)));
		}
	}

	// ? Bots cannot use this endpoint (20001)
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

	if (interaction.isAutocomplete())
		return handleAutocomplete(interaction);

	if (interaction.isButton())
		return handleButton(interaction);
});

// ? // // // // // // // // // // // // // // // // // // // // //

const sorryErrOcc = { content: '☹️ Sorry, an error occured. Please try again later.', ephemeral: true };

async function handleSlashCommands(interaction)
{
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

async function handleAutocomplete(interaction)
{
	await interaction.respond(
		Object.keys(process.houses)
			.map(v => v.name)
		  	.filter(choice => choice.includes(interaction.options.getFocused()))
		  	.map(choice => ({
				name: choice[0].toUpperCase() + choice.slice(1).toLowerCase(),
				value: choice.toLowerCase(),
		}))
	);
}

async function handleButton(interaction)
{
	const handler = client.commands.get(interaction.message.interaction.commandName);

	if(!handler) return interaction.reply(sorryErrOcc);

	try {
		return handler.buttonPress(interaction);
    }
    catch(error) {
		process.logError(error);
    }

	interaction.reply(sorryErrOcc);
}