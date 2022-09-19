/// Base class representing a server house
class House
{
    constructor({name, motto, color, banner})
    {
        // House name
        this.name = name;

        // House motto
        this.motto = motto || "";

        // House base color
        this.color = color || "";
        
        // House url banner image
        this.banner = banner || "https://cdn.discordapp.com/attachments/1018969696445403217/1018969756709171250/missingimage.png";

        // Used to determine which house to save the data in
        this.old = this.name;
    }

    // ? (name VARCHAR(20), motto VARCHAR(40), banner VARCHAR(150), color VARCHAR(6))

    // * Possibity of outdated / old data
    // ? Use House.set() when keeping this object alive for long
    save()
    {
        process.env.conn.query(`UPDATE houses SET name = '${this.name}', motto = '${this.motto}', banner = '${this.banner}', color = '${this.color}' WHERE name = '${this.old}'`, (err, res) => {
            if(res.affectedRows === 0)
            {
                throw Error("Outdated data found in House, object was kept alive for too long.");
            }
            else
            {
                this.old = this.name;
            }
        });
    }

    static async get(name)
    {
        if(!name) return null;
        return await new Promise(resolve => {
            process.env.conn.query(`SELECT * FROM houses WHERE name = '${name}'`, (err, res) => {
                resolve(new House(res));
            });
        });
    }

    static async set(_name, {name, motto, color, banner})
    {
        if(!_name || !data) return null;
        return await new Promise(resolve => {
            process.env.conn.query(`UPDATE houses SET name = '${name}', motto = '${motto}', banner = '${banner}', color = '${color}' WHERE name = '${_name}'`, (err, res) => {
                resolve();
            });
        });
    }


    static async create(name)
    {
        if(!name) return null;
        return await new Promise(resolve => {
            process.env.conn.query(`INSERT INTO houses (name) VALUES ('${name}')`, (err, res) => {
                resolve(new House({name}));
            });
        });
    } 

    static async delete(name)
    {
        if(!name) return null;
        return await new Promise(resolve => {
            process.env.conn.query(`DELETE FROM houses WHERE name = '${name}'`, (err, res) => {
                resolve();
            });
        });
    }
}

module.exports = House;