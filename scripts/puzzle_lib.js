const { MessageActionRow, MessageButton, EmbedBuilder, Collection, Colors } = require('discord.js');
const https = require('https');

function randomNumber(max, min = 0)
{
    return Math.floor(Math.random() * (max - min) + min);
}

const icon = 'https://cdn3.iconfinder.com/data/icons/brain-games/1042/Puzzle-grey.png';

class PuzzleLibrary
{
    async send(channel)
    {
        const row = new MessageActionRow()
        .addComponents(
			new MessageButton()
				.setCustomId(this.id + this.puzzle.index)
				.setLabel('View solution')
				.setStyle('DANGER'),
		    );

        this.embed
            .setAuthor(this.puzzle.title, icon)
            .setDescription(this.puzzle.riddle)
        
        channel.send({ embeds: [this.embed], components: [row] })

        this.puzzle = await PuzzleUtils.fetchRiddle(this.uri, this.pages);
        this.cache.set(this.puzzle.index, this.puzzle);
    }

    async interact(interaction)
    {
        const index = parseInt(interaction.customId.split(':')[1]);
        const embed = new EmbedBuilder().setColor(this.embed.color);
        var cache = this.cache.get(index);

        if(!cache)
        {
            embed.setDescription('Fetching answer...');
            
            interaction.reply({ embeds: [embed], ephemeral: true  }).then(async i => {
            
                cache = await PuzzleUtils.findRiddle(this.uri, index);
                this.cache.set(cache.index, cache);
    
                embed
                    .setDescription(cache.answer)
                    .setAuthor(cache.title, icon);
    
                interaction.editReply({ embeds: [embed], ephemeral: true }).catch(console.error);
           
            }).catch(console.error);
        }
        else
        {
            embed
                .setDescription(cache.answer)
                .setAuthor(cache.title, icon);

            interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
        }
    }

    constructor(uri, embed, pages)
    {
        embed = embed.setColor(Colors.Orange)
        this.uri = `https://www.riddles.com/${uri}?page=`;
        this.id = uri+':';
        this.embed = embed;
        this.pages = pages;
        this.cache = new Collection();

        (async () => {
            this.puzzle = await PuzzleUtils.fetchRiddle(this.uri, this.pages);
            this.cache.set(this.puzzle.index, this.puzzle);
			console.log(` ✓ loaded lib ${this.id}`);
        })();
    }
}

class PuzzleUtils
{
    static async fetchRiddle(uri, pages, obj = undefined)
    {
        const page = pages === -1? '' : randomNumber(pages);
        
        return new Promise(resolve => {
            https.get(uri + page, (resp) => 
            {
                let data = "";
    
                resp.on('data', (chunk) =>
                {
                    data += chunk;

                   
                });
    
                resp.on('end', async () => 
                { 
                    // ? Auto page count detection
                    // const m = data.match(/(?<=<title>.+\d....).*(?= .+<\/title>)/gm);
                    // if(m != null) console.log(m[0])

                    // if(pages === -1)
                    // {
                    //     const riddle = data.match(/(?<=Riddle:<\/strong>  ).*?(?=$)/gm)[0];
                    //     const title = data.match(/(?<=.">).*?(?=<\/h1>)/gm)[0];
                    //     const answer = data.match(/(?<=>: ).*?(?=$)/gm)[0];

                    //     resolve({
                    //         title:  title.replace(/\\n|\\r/gm, '').replace(/&#039;/, "'"),
                    //         riddle: riddle.replace(/\\n|\\r/gm, '').replace(/&#039;/, "'"),
                    //         answer: answer.replace(/\\n|\\r/gm, '').replace(/&#039;/, "'"),
                    //         index: obj.index,
                    //         page: obj.page
                    //     });
                        
                    //     return;
                    // }

                    const riddles = data.match(/(?<=Riddle:<\/strong>  ).*?(?=..<div class)/gms);

                    if(riddles == null)
                    {
                        console.log(page);
                        console.log(uri);
                        resolve(undefined);
                        return;
                    }

                    const index = randomNumber(riddles.length);
                    const titles = data.match(/(?<=<h3 class="panel-title lead inline">).*?(?=<\/h3>)/gms);
                    const answers = data.match(/(?<=Answer<\/strong>: ).*?(?=\n)/gms);
                   
                    resolve(PuzzleUtils.cleanRiddle({
                        title:  titles[index],
                        riddle: riddles[index],
                        answer: answers[index],
                        index : (page - 1) * 10 + index
                    }));
                });
    
                resp.on('error', () => resolve("error"))
            });
        })
    }

    static async findRiddle(uri, index)
    {
        const xindex = index;
        const page = Math.floor((index + 10) / 10);
        index = index % 10;

        return new Promise(resolve => {
            https.get(uri + page, (resp) => 
            {
                let data = "";
    
                resp.on('data', (chunk) =>
                {
                    data += chunk;
                });
    
                resp.on('end', async () => 
                { 
                    const riddles = data.match(/(?<=Riddle:<\/strong>  ).*?(?=..<div class)/gms);
                    const titles = data.match(/(?<=<h3 class="panel-title lead inline">).*?(?=<\/h3>)/gms);
                    const answers = data.match(/(?<=Answer<\/strong>: ).*?(?=\n)/gms);
                   
                    resolve(PuzzleUtils.cleanRiddle({
                        title:  titles[index],
                        riddle: riddles[index],
                        answer: answers[index],
                        index : xindex
                    }));
                });
    
                resp.on('error', () => resolve("error"))
            });
        })
    }

    static cleanRiddle(obj)
    {
        try{
            obj.title = obj.title.replace(/\\n|\\r/gm, '').replace(/&#039;/, "'");
            obj.riddle = obj.riddle.replace(/\\n|\\r/gm, '').replace(/&#039;/, "'");
            obj.answer = obj.answer.replace(/\\n|\\r/gm, '').replace(/&#039;/, "'");
        }
        catch{
            obj.title = obj.riddle = obj.answer = "An error occurred";
        }
        
        return obj;
    }
}

module.exports = PuzzleLibrary;