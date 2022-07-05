const ytdl = require("ytdl-core");
const yts = require("yt-search");
const { joinVoiceChannel, StreamType, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { MessageEmbed } = require("discord.js");

var client;

module.exports = 
{
    commands:['play', 'p'],

    execute : async function(message, embed, args)
    {
        const vc = message.member.voice.channel;
        
        if (!vc)
            return message.channel.send("Oi dum dum, you need to be in vc to use this command.");

        if(message.content.trim().length == 0)
        {
            return message.channel.send("Gimme a link or song name to play please.");
        }

        // START: Setup
        
        var music;

        if(!client.music.hasAny(message.guild.id))
        {
            music = new AutoQueuer(
                joinVoiceChannel({
                    channelId: vc.id,
                    guildId: vc.guild.id,
                    adapterCreator: vc.guild.voiceAdapterCreator,
                }),
                createAudioPlayer(),
                message.channel
            )

            music.connection.subscribe(music.player);
            
            client.music.set(message.guild.id, music);

            embed.setDescription("**Connecting...**").setColor('202225');

            await new Promise(resolve => {
                message.channel.send({ embeds: [embed] }).then(message => {
                    music.connection.on("ready", () => {
                        message.delete()
                        resolve();
                    });
                });
            });
        }
        else music = client.music.get(message.guild.id);

        // END: Setup

        const searched = await yts.search(message.content);
        
        if (searched.videos.length == 0) 
        {
            sent.delete();
            embed.setDescription(`**Oops, I couldn't find anything!**`);
            return message.channel.send({ embeds: [embed] });
        }

        const songInfo = searched.videos[0];

        music.queue.push({ 
            url: songInfo.url, 
            title: songInfo.title,
            length: songInfo.duration.seconds,
            id: message.member.id,
            thumbnail: songInfo.thumbnail
        });

        if(music.queue.length == 1)
            music.player.emit("idle");
        else
        {
            let len = -songInfo.duration.seconds;
            music.queue.forEach(track => {
                len += track.length;
            });

            const embed = new MessageEmbed()
                .setAuthor("Track Added")
                .setDescription(`**[${songInfo.title}](${songInfo.url})**`)
                .addField("Estimated time until played", `${toHHMMSS(len)}`, true)
                .addField("Track Length", `${toHHMMSS(songInfo.duration.seconds)}`, true)
                .addField("Position in queue", `${music.queue.length - 1}`, false)
                .setThumbnail(songInfo.thumbnail)
                .setColor("202225");
            message.channel.send({ embeds: [embed] });
        }
    },
    
    initialize : async function(c, con, data)
    {
        client = c;
    },
}

function toHHMMSS (_s) 
{
    let s = _s.toString();
    var sec_num = parseInt(s, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

class AutoQueuer {

    disconnect(){
        if(this.timeout)
            clearTimeout(this.timeout);
        this.player.stop(true);
        this.connection.disconnect();
        this.connection.destroy();
        this.channel.client.music.delete(this.channel.guild.id);
    }

    resume(){
        clearTimeout(this.timeout);
        this.timeout = undefined;
    }

    skip(){
        if(this.queue.length == 0)
            return this.current != undefined;

        setTimeout(() => {
            this.player.stop(true);
        }, 300);

        return true;
    }

    constructor(connection, player, channel) {
        this.timeout = undefined;
        this.current = undefined;
        this.cachedResource = undefined;
        this.connection = connection;
        this.player = player;
        this.channel = channel;
        this.queue = [];

        this.player.on("idle", () => {
            if(this.queue.length == 0)
            {
                if(this.timeout)
                {
                    this.current = undefined;
                    const embed = new MessageEmbed()
                    .setColor("e50000")
                    .setDescription(`There are no more tracks`);
                    this.channel.send({ embeds: [embed] });
                    this.timeout = setTimeout(() => this.disconnect(), 180000);
                }    
                return;
            }

            this.resume();
            
            this.current = this.queue.shift();

            let resource;

            if(this.cachedResource)
            {
                resource = this.cachedResource;
            }
            else
            {
                const stream = ytdl(this.current.url, { filter : 'audioonly' });
                resource = createAudioResource(stream, { inputType: StreamType.WebmOpus, inlineVolume: true });
                resource.volume.setVolume(0.5);
            }
         
            this.player.play(resource);
    
            const embed = new MessageEmbed()
            .setColor("4CFF4C")
            .setDescription(`Started playing **[${this.current.title}](${this.current.url})**`);
            this.channel.send({ embeds: [embed] });

            // cache the next resource
            if(this.queue.length > 0)
            {
                const stream = ytdl(this.queue[0].url, { filter : 'audioonly' });
                this.cachedResource = createAudioResource(stream, { inputType: StreamType.WebmOpus, inlineVolume: true });
                this.cachedResource.volume.setVolume(0.5);
            }
        });

        this.player.on("error", error => {
            const embed = new MessageEmbed()
            .setColor("e50000")
            .setDescription(`Oops, an error occurred: \`${error}\``);
            this.channel.send({ embeds: [embed] });
            this.disconenct();
        });

        this.connection.on("disconnected", () => {
            this.disconnect();
        });
    }
};