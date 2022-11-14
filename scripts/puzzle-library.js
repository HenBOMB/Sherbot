const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder 
} = require('@discordjs/builders');
const { Colors, ButtonStyle } = require('discord.js');
const got = require('got');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

function getDocument(url) {
    return new Promise(resolve => {
        got(url).then(({ body }) => {
            resolve(new JSDOM(body).window.document)
        });
    });
}

// ? ID Format: command*host:path:category

function generateId(name, source, category, ...extra) {
    return `cmd*${name}*${source.host}:${source.path? source.path : `-`}:${category}:${extra.join(':')}`;
}

module.exports = class PuzzleLibrary {
    constructor (name) {
        this.name = name; 
        this.config = require(`../data/configs/${name}.json`);
        this.cache = {}; // TODO
    }

    /**
     * Fetches a random Puzzle
     * @param category Category to choose from
     * @returns {Promise<{ title?: string | undefined, question: string, answer: string, id: string, category: string }>()}
     */
    async fetch(category = '') {
        category = category || randomItem(Object.keys(this.config));
        const source = randomItem(this.config[category]);

        if(source.host === 'data')
        {
            const list = require(`../data/${this.name}/${category}.json`);
            const index = Math.floor(Math.random() * list.length);
            const id = generateId(this.name, source, category, index);

            this.cache[id] = { answer: list[index].answer, title: list[index].title, category };

            return {
                ...list[index],
                id,
                category
            };
        }

        if(source.host === 'icebreakerideas')
        {
            const url = `https://icebreakerideas.com/${source.path}/`;
            const document = await getDocument(url);
            const _category = randomItem(source.categories);

            const headers = document.querySelectorAll('h2');
            const riddles = document.querySelectorAll('ul');

            const options = [];
            let start = 0;

            for (let i = 0; i < riddles.length; i++) 
            {
                const riddle = riddles[i];
                
                if(!riddle.children[0].querySelector('div')) 
                {
                    start = i;
                    continue;
                }

                if(headers[i - start - 1].firstChild.id !== _category)
                {
                    continue;
                }

                for (const node of riddle.children) 
                {
                    options.push(node.textContent.split('Show answer').map(v => v.trim()));
                }
            }

            const index = Math.floor(Math.random() * options.length);
            const [ question, answer, title ] = options[index];
            const id = generateId(this.name, source, _category, index);

            this.cache[id] = { answer, title, category };

            return { question, id, ...this.cache[id] };
        }
        
        if(source.host === 'riddles')
        {
            const url = `https://www.riddles.com/${source.path}`;

            const pages = await new Promise(resolve => {
                got(url).then(({ body }) => {
                    const document = new JSDOM(body).window.document;
                    const pagination = document.querySelector('.pagination');
                    resolve(parseInt(pagination.children[pagination.children.length-2].textContent));
                })
                .catch(err => {
                    console.log(err);
                });
            }) + 1;

            const page = Math.floor(Math.random()*pages);
            const document = await getDocument(url+`?page=${page}`);
            const panels = document.getElementsByClassName('panel-default');
            const index = Math.floor(Math.random() * panels.length);
            const panel = panels[index];
            if(!panel)
            {
                console.log(panels);
            }
            const title = panel.querySelector('.panel-heading').querySelector('h3').textContent;
            const question = panel.querySelector('a').title.slice(8);
            const answer = panel.querySelector('.mar_top_15').textContent.trim().slice(8);
            const id = generateId(this.name, source, category, page, index);

            this.cache[id] = { answer, title, category: category };

            return { question, id, ...this.cache[id] };
        }
    }    

    /**
     * Gets a random Puzzle from an ID
     * @param id
     * @returns {Promise<{ title?: string | undefined, answer: string, category: string }>}
     */
    async get(id) {
        if(this.cache[id])
        {
            return this.cache[id];
        }

        // ? cmd*puzzle*data:-:brain-teaser:12
        const [ , name, rid ] = id.split('*');
        // ? rid => data:-:brain-teaser:12
        const [ host ] = rid.split(':');

        if(host === 'data')
        {
            const [ , , category, index ] = rid.split(':');
            const list = require(`../data/${name}/${category}.json`);
            this.cache[id] = { ...list[index], category };
            delete this.cache[id].question;
        }
        
        else if(host === 'icebreakerideas')
        {
            const [ , path, category, index ] = rid.split(':');
            const document = await getDocument(`https://${host}.com/${path}/`);
            const headers = document.querySelectorAll('h2');
            const riddles = document.querySelectorAll('ul');

            const options = [];
            let start = 0;

            for (let i = 0; i < riddles.length; i++) 
            {
                const riddle = riddles[i];
                
                if(!riddle.children[0].querySelector('div')) 
                {
                    start = i;
                    continue;
                }

                if(headers[i - start - 1].firstChild.id !== category)
                {
                    continue;
                }

                for (const node of riddle.children) 
                {
                    options.push(node.textContent.split('Show answer').map(v => v.trim()));
                }
            }

            const [ , answer, title ] = options[index];
            
            this.cache[id] = { answer, title, category };
        }
        
        else if(host === 'riddles')
        {
            const [ , path, category, page, index ] = rid.split(':');

            const document = await getDocument(`https://www.riddles.com/${path}?page=${page}`);
            const panel = document.getElementsByClassName('panel-default')[index];
            const title = panel.querySelector('.panel-heading').querySelector('h3').textContent;
            const answer = panel.querySelector('.mar_top_15').textContent.trim().slice(8);

            this.cache[id] = { answer, title, category };
        }

        return this.cache[id];
    }

    /**
     * Returns and builds a message component from a puzzle
     * @param {{ title?: string | undefined; ?question: string; ?answer: string; ?id: string; ?category: string }} data
     * @return {{ embeds: EmbedBuilder[]; embeds: EmbedBuilder[]; ephemeral?: boolean; components?: undefined;}}}
     */
    embed(puzzle) {
        const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setAuthor(puzzle.title? { name: puzzle.title } : null);

        if(puzzle.id)
        {
            return { 
                embeds: [
                    embed.setDescription(puzzle.question).setFooter({
                        text: puzzle.category.split('-').map(v => v[0].toUpperCase() + v.slice(1)).join(' '),
                        iconURL: this.config[puzzle.category][0].thumbnail || 'https://cdn-icons-png.flaticon.com/512/584/584764.png',
                    })
                ], 
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(puzzle.id)
                                .setLabel('Show Answer')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setCustomId(`cmd*${this.name}*more:${puzzle.category}`)
                                .setLabel('More')
                                .setStyle(ButtonStyle.Secondary)
                        )
                ] 
            }
        }

        return { 
            embeds: [ embed.setDescription(puzzle.answer) ],
            ephemeral: true,
        }
    }
}