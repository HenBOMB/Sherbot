const lineReader = require('line-reader')

const { distance } = require('fastest-levenshtein');


module.exports = {
    tick(message)
    {
        if(message.author.id !== process.ownerId) return;

        lineReader.eachLine('./data/bad_words.txt', (line, last) => {
            const words = message.content.split(' ');

            for (let i = 0; i < words.length; i++) 
            {
                const word = words[i];

                if(word.length < 5) continue;

                const score = distance(line, word);

                if(score > 2) continue;

                console.log(`${word} - ${line}: ${score}`);

                message.channel
                    .send({ content: `${message.member} Watch your language.`, ephemeral: true })
                    .then(msg => setTimeout(() => { msg.delete(); }, 3000));

                message.delete();
                
                return false;
            }
        });
    },
};