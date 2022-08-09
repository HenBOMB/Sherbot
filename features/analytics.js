var connection;

module.exports =
{
    initialize : function(guild, con, data)
    {
        connection = con;
    },
    
    execute : function(embed)
    {
        
    },

    tick : async function(message)
    {
        if(!['852185253279170572', '852469428759298058', '852185225432793108', '856119014597459998', '868129935347286026'].includes(message.channel.id)) return

        const q = `WHERE id = ${message.author.id}`

        connection.query(`SELECT * FROM analytics ${q}`, (err, res) => {
            if(res.length === 0)
                return connection.query(`sql INSERT INTO analytics (id, ded_hands, ded_person, ded_object, ded_room, ded_any, solved_puzzles) VALUES (${message.author.id}, 0, 0, 0, 0, 0, 0)`);

            if(message.content.length < 90 || !message.content.test(/(?<=\|\|)(.*)(?=\|\|)/gm))
                return

            switch (message.channel.id) {
                // hand deduce
                case '852185253279170572':
                    return connection.query(`UPDATE analytics SET ded_hands = ${res.ded_hands+1} ${q}`);
                // people deduce
                case '852469428759298058':
                    return connection.query(`UPDATE analytics SET ded_person = ${res.ded_person+1} ${q}`);
                // room deduce
                case '852185225432793108':
                    return connection.query(`UPDATE analytics SET ded_room = ${res.ded_room+1} ${q}`);
                // object deduce
                case '856119014597459998':
                    return connection.query(`UPDATE analytics SET ded_object = ${res.ded_object+1} ${q}`);
                default:
                    return connection.query(`UPDATE analytics SET ded_any = ${res.ded_any+1} ${q}`);
            }
        });
    },
};