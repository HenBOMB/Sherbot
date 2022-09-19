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

    async save(conn)
    {
        const q = `UPDATE users SET house = '${this.house}', msg_me = '${this.msg_me}', msg_ded = '${this.msg_ded}', msg_house = '${this.msg_house}' WHERE id = '${this.uid}'`;
        
        return await new Promise(resolve => {
            conn.query(q, (err, res) => {
                if(res.affectedRows === 0)
                {
                    conn.query(`INSERT INTO users (id) VALUES ('${this.id}')`, (err, res) => {});
                    this.save(conn);
                    conn.query(q, (err, res) => { });
                }
                resolve();
            });
        })
    }

    async load(conn)
    {
        return await new Promise(resolve => {
            conn.query(`SELECT * FROM users WHERE id = '${this.id}'`, async (err, res) => {
                this.house = res.house || "";
                this.msg_me = res.msg_me || 0;
                this.msg_ded = res.msg_ded || 0;
                resolve()
            });
        });
    }

    static async load(conn, id)
    {
        const house = new Member(id);
        await house.load(conn);
        return house;
    }
}

module.exports = Member;