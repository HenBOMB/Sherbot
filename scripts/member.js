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
        this.count_me = 0;

        // Total deduction messages
        this.count_ded = 0;

        // Total messages while in a house
        this.count_house = 0;
    }

    // ? (id VARCHAR(22) PRIMARY KEY, house VARCHAR(26), count_me INT, count_ded INT, count_house INT)

    async save()
    {
        const q = `UPDATE members SET house = '${this.house}', count_me = ${this.count_me}, count_ded = ${this.count_ded}, count_house = ${this.count_house} WHERE id = '${this.id}'`;
        
        return new Promise(resolve => {
            process.conn.query(q, async (err, res) => {
                process.logError(err);
                if(!res && !res.affectedRows)
                {
                    process.conn.query(`INSERT INTO members (id) VALUES ('${this.id}')`, (err, res) => {
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
            process.conn.query(`SELECT * FROM members WHERE id = '${this.id}'`, async (err, res) => {
                process.logError(err);
                this.house = res.house || "";
                this.count_me = res.count_me || 0;
                this.count_ded = res.count_ded || 0;
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