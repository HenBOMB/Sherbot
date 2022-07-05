const { MusicDefaultCheck } = require('../../../tools/utils.js');
const https = require("https");
const { JSDOM } = require('jsdom');

var client;

module.exports = 
{
    commands:['lyrics', 'lyr'],

    execute : async function(message, embed, args)
    {
        const music = client.music.get(message.guild.id);

        embed.setDescription("**Fetching Lyrics...**").setColor("202225");

        const sent = await message.channel.send({ embeds: [embed] });

        let results;

        if(args.length > 0)
            results = await fetchResults(message.content.replace(/ /g,"+"));
        else
        {
            if(music.current)
                results = await fetchResults(music.current.title);
            else
            {
                embed.setDescription(`There are no tracks currently playing`).setColor("e50000");
                return message.channel.send({ embeds: [embed] });
            }
        }

        if(results == undefined)
        {
            embed.setDescription("No lyrics for the current track found").setColor("e50000");
            return message.channel.send({ embeds: [embed] });
        }

        // Send results as options

        let text = "";
        for (let i = 0; i < results.length; i++)
            text += `**${i+1}) [${results[i].title} - ${results[i].artist}](${results[i].url})**\n`

        embed.setDescription(text).setColor("202225");

        sent.edit({ embeds: [embed] });
        
        // Wait for chosen result

        const filter = m => !isNaN(m.content) && Number.isInteger(parseFloat(m.content));
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        await new Promise(resolve => {
            collector.on('collect', m => {
                chosen = parseInt(m);
                if(chosen == 0 || chosen > results.length) 
                {
                    chosen = 0;
                    return;
                }
                
                m.delete();
                collector.stop();
                resolve();
            });
        })

        sent.delete();

        if(chosen == 0)
            return;

        chosen -= 1;

        const lyrics = await fetchLyrics(results[chosen].url);
        if(lyrics.lyrics.length > 2000) lyrics.lyrics = lyrics.lyrics.slice(0, 2000);

        embed.setAuthor(lyrics.title)
        .setDescription(lyrics.lyrics);

        message.channel.send({ embeds: [embed] });
    },
    
    initialize : async function(c, con, data)
    {
        client = c;
    },

    fetchLyrics : async function(query)
    {
        const result = await new Promise(resolve => {
            https.get("https://search.azlyrics.com/?q="+query, (resp) => 
            {
                let data = "";
      
                resp.on('data', (chunk) =>
                {
                    if(chunk.includes('Sorry, your search returned'))
                    {
                        resp.emit('end');
                        data = undefined;
                        resolve(undefined);
                        return;
                    }
                    data += chunk;
                });
      
                resp.on('end', () => 
                { 
                    if(data == undefined)
                    {
    
                        return;
                    }
                });
            });
        });

        console.log(result);
        /* 
        search for song in azlyrics

        if none found:
            search in lyricfinder.org

            if none found:
                return

            show available options

            return

        */
    },

    parseLyrics : async function(url)
    {
        if(url.includes("lyricfinder"))
        {

        }
        else if(url.includes("azlyrics"))
        {

        }
        else
        {
            // Invalid url
        }

    }
}

async function fetchLyrics(url)
{
    if(url == undefined)
        return undefined;

    return await new Promise(resolve => 
    {
        https.get(url, (resp) => 
        {
            let data = "";
        
            resp.on('data', (chunk) =>
            {
                data += chunk;
            });
            
            resp.on('end', async () => 
            { 
                if(url.includes('azlyrics'))
                {
                    const artist = data.match(/(?<=ArtistName = ").*?(?=")/)[0];
                    const song = data.match(/(?<=SongName = ").*?(?=")/)[0];
    
                    // Slice data
    
                    data = data.slice(data.indexOf("<b>")+120);
                    data = data.slice(0, data.indexOf("<br><br>"));
    
                    // Find data
    
                    const feat = data.match(/\(feat.+\)/);
                    const dom = new JSDOM(data).window.document;
    
                    let lyrics = dom.querySelector("div").textContent;
                    let title = `${song} by ${artist} ${feat.length>0?feat[0]:""}`;
    
                    // Beautify
    
                    lyrics = lyrics.replace(/\[/g, '*[');
                    lyrics = lyrics.replace(/\]/g, ']*');
                    lyrics = lyrics.replace(/:\]/g, ']');
                    title = title.replace("feat.", "Ft.");
    
                    resolve({ title: title, lyrics: lyrics });
                }
                else if(url.includes('lyricfinder'))
                {
                    const artist = data.match(/(?<=artist: ").*?(?=",)/)[0];
                    const song = data.match(/(?<=song: ").*?(?=",)/)[0];

                    // Slice data

                    data = data.slice(data.indexOf('<!-- End Ezoic - LyricsLeft - sidebar -->') + 41);
                    data = data.slice(0, data.indexOf('<br/><br/>'));

                    // Find data

                    const dom = new JSDOM(data).window.document;

                    let lyrics = dom.querySelector("div").textContent;
                    let title = `${song} by ${artist} ${feat.length>0?feat[0]:""}`;
    
                    // Beautify
    
                    lyrics = lyrics.replace(/\[/g, '*[');
                    lyrics = lyrics.replace(/\]/g, ']*');
                    lyrics = lyrics.replace(/:\]/g, ']');
                    title = title.replace("feat.", "Ft.");
    
                    resolve({ title: title, lyrics: lyrics });
                }
                else
                {
                    resolve(undefined);
                }
            });
    
            resp.on('error', () => resolve("error"))
        });
    });    
}

async function fetchResults(query, complex = false)
{
    return await new Promise(resolve => 
    {
        const url = complex? "https://lyricfinder.org/search?searchtype=tracks&query=" : "https://search.azlyrics.com/search.php?q=";
        
        https.get(url + query, (resp) => 
        {
            let data = "";
        
            resp.on('data', (chunk) =>
            {
                if(complex && chunk.includes('Sorry, your search returned'))
                {
                    resolve(undefined);
                    return;
                }
                else if(!complex && chunk.includes('No search results found'))
                {
                    resolve(await (fetchResults(query, true)));
                    return;
                }
    
                data += chunk;
            });
        
            resp.on('end', async () => 
            { 
                resolve(await parseResults(data, complex? "lyricfinder" : "azlyrics"));
            });
    
            resp.on('error', () => resolve("error"))
        });
    });
}

/*
returns : 
[{
    artist,
    title,
    url,
}]
*/
async function parseResults(data, domain)
{
    let artists = [];
    let titles = [];
    let urls = [];

    if(domain == 'azlyrics')
    {
        data = data.slice(data.indexOf("<div class=\"panel\">") + 180);
        data = data.slice(0, data.indexOf("</table>"));

        artists = data.match(/(?<=<b>)\w.+(?=<\/b><\/a>)/g);
        titles = data.match(/(?<=<b>").+(?="<\/b>)/g);
        urls = data.match(/(?<=href=").+(?=">)/g);
    }
    else if(domain == 'lyricfinder')
    {
        data = data.slice(data.indexOf("All search results:") + 21);
        data = data.slice(0, data.indexOf("<div class=\"col-md-3\">"));
    
        const dom = new JSDOM(data).window.document;
        
        for (let i = 0; i < dom.links.length; i++)
            urls.push(dom.links[i].href);
    
        dom.querySelectorAll("h4").forEach(value => {
            const v = value.textContent.split(" -  ");
            artists.push(v[0]);
            titles.push(v[1]);
        });
    }

    if(urls.length == 0)
    {
        return undefined;
    }

    const obj = [];

    for (let i = 0; i < titles.length || i < 5; i++) {
        obj.push({
            artist: artists[i],
            title: titles[i],
            url: urls[i]
        })
    }

    return obj;

}