
const { PermissionFlagsBits } = require('discord.js')

module.exports =
{
    description: "Sends a server member to jail",

    options: [
        {
            type: 9,
            name: "user",
            description: "User that will be sent to Jail.",
            required: true
        },
        {
            type: 4,
            name: "duration",
            description: "Sentence duration.",
            choices: [
                {
                    name: "3 days",
                    value: 3
                },
                {
                    name: "1 week",
                    value: 7
                },
                {
                    name: "2 weeks",
                    value: 14
                },
                {
                    name: "3 weeks",
                    value: 21
                },
                {
                    name: "1 month",
                    value: 30
                },
                {
                    name: "2 months",
                    value: 60
                }
            ],
            required: true
        },
        {
            type: 3,
            name: "reason",
            description: "Reason for sending the member to Jail.",
            required: true
        }
    ],

    // ? @Director and @Warden
    roles: ['742750595345022978', '670114268858810369'],

    // ? https://discord.js.org/#/docs/discord.js/main/class/CommandInteractionOptionResolver
    // ? https://discord.js.org/#/docs/discord.js/main/class/ChatInputCommandInteraction
    interact : async function({ member, options })
    {
        const inmate = options.getMentionable('user');
        const reason = options.getString('reason');
        const duration = new Date();
        duration.setDate(duration.getDate() + options.getInteger('duration'));
        
        const channels = member.guild.channels.cache.filter(v => v.parentId === '1025816106985852948' && v.name.includes('cell'));

        // ! If they are already in jail, skip
        if (await new Promise(resolve => process.conn.query(`SELECT * FROM jail WHERE id = '${inmate.id}'`, (err, res) => {
            process.logError(err);
            resolve(res[0]?.id);
        })))
        {
            return `${inmate.displayName} is already in Jail!`;
        }

        const cells = {};

        channels.forEach(channel => {
            // ? Disable sending messages in other cells
            channel.permissionOverwrites.create(inmate, { SendMessages: false });

            // ? Fill up the dict with the channels ids as keys and an accumulator
            cells[channel.id] = 0;
        })

        // ? Find any available cell
        const cell = await new Promise(resolve => process.conn.query(`SELECT * FROM jail`, async (err, res) => {
            process.logError(err);

            // ? Get how many of the channels id match the cell id and add it
            res.forEach(db => {
                cells[db.cell] = (cells[db.cell] ?? 0) + 1;
            });

            for(const key in cells)
                if(cells[key] !== 3)
                    return resolve(channels.get(key));

            resolve(channels.first().clone());
        }));

        let perms = cell.permissionOverwrites.cache.map(v => v);

        // TODO Must refresh every cell!

        // ? Unallow sending messages from other inmates (not all)
        if(perms.filter(v => v.type === 1) === 3)
        {
            perms = perms.map(v => { 
                if(v.type !== 1) return v;
                v.allow = [];
                v.deny = [PermissionFlagsBits.SendMessages]
                return v;
            });
        }

        // ? Allow the inmate to send messages
        if(new Date().getUTCHours() > 20)
        {
            perms.push({
                id: inmate.id,
                deny: [PermissionFlagsBits.SendMessages],
            })
        }
        else
        {
            perms.push({
                id: inmate.id,
                allow: [PermissionFlagsBits.SendMessages],
            })
        }

        const format = this.options[1].choices.find(v => v.value === options.getInteger('duration'));
        const inmates = (await Promise.all(perms.filter(v => v.type === 1).map(v => member.guild.members.fetch(v.id)))).map(v => v.displayName);
        const l = inmates.length;

        if(inmates.length < 3) inmates.push('[vacant]');
        if(inmates.length < 3) inmates.push('[vacant]');

        // ? Refresh the channel settings
        await cell.edit({
            topic: `(${l}/3) ${inmates.join(', ')}`,
            permissionOverwrites: perms,
        });

        // ? Add the inmate role and remove the verified role
        await inmate.roles.add('670113370938277888', 'Entered Jail');
        await inmate.roles.remove('906128248193306635', 'Entered Jail');

        // ? Save to db and log message
        return new Promise(resolve => process.conn.query(`INSERT INTO jail (id,cell,arrival,departure,reason) VALUES ('${inmate.id}','${cell.id}','${Date.now()}','${duration.getTime()}','${reason}')`, (err, res) => {
            process.logError(err);
            resolve({content: `${inmate.displayName} has been sentenced to ${format} in Jail!`, ephemeral: true});
        }));
    },
};

/*

?jail [@user] [14d, 7d, 3d] (cell) (reason)
* ?jail @User#1234 14d 0 insulted a warden

?release [@user] (reason)

* https://www.vangla.ee/en/news-and-numbers/example-daily-prison-schedule
* 06:30 -> 20:00

*/