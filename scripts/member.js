/// Base class representing a server member
class Member
{
    constructor(id)
    {
        // Member id
        this.id = id;

        // House name in which the member is in
        this.house = "";

        // Total messages
        this.msg_me = 0;

        // Total deduction messages
        this.msg_ded = 0;

        // Total messages while in a house
        this.msg_house = 0;
    }

    // ? (id VARCHAR(22) PRIMARY KEY, house VARCHAR(26), msg_me INT, msg_ded INT, msg_house INT)

    async save()
    {
        const q = `UPDATE users SET house = '${this.house}', msg_me = ${this.msg_me}, msg_ded = ${this.msg_ded}, msg_house = ${this.msg_house} WHERE id = '${this.id}'`;
        
        return new Promise(resolve => {
            process.conn.query(q, async (err, res) => {
                process.logError(err);
                if(!res && !res.affectedRows)
                {
                    process.conn.query(`INSERT INTO users (id) VALUES ('${this.id}')`, (err, res) => {
                        process.logError(err);
                        process.conn.query(q, process.logError);
                        resolve();                        
                    });
                }
                else
                {
                    resolve();
                }
            });
        })
    }

    async load()
    {
        return await new Promise(resolve => {
            process.conn.query(`SELECT * FROM users WHERE id = '${this.id}'`, async (err, res) => {
                process.logError(err);
                this.house = res.house || "";
                this.msg_me = res.msg_me || 0;
                this.msg_ded = res.msg_ded || 0;
                resolve()
            });
        });
    }

    static async load(id)
    {
        const member = new Member(id);
        await member.load();
        return member;
    }
}

module.exports = Member;