
class Houses
{
    /**
     * Parses raw sql data into a House object
     * @param {object} data
     * @return {object|undefined}
     */
    static parse(data)
    {
        if(!data) return;

        // TODO This parsing is dodgy

        if(data.name) data.name = data.name.replace(/''/gm,"'");

        if(data.description) data.description = data.description.replace(/''/gm,"'");

        if(data.motto) data.motto = (data.motto || '').replace(/''/gm,"'");

        if(data.banner) data.banner = (data.banner || '').replace(/''/gm,"'");

        if(data.xp === null) data.xp = 0;

        if(data.invite_only === null) data.invite_only = false;

        if(data.banned !== null && data.banned !== undefined) data.banned = data.banned.split(',').filter(Boolean);

        else if(data.banned === null || data.banned === undefined) data.banned = [];

        if(data.members !== null && data.members !== undefined) data.members = data.members.split(',').filter(Boolean);

        else if(data.members === null || data.members === undefined) data.members = [];

        return data;
    }

    /**
     * Returns an array of string representing every House name in the server.
     * @return {Promise<string[]>}
     */
    static async getNames()
    {
        return new Promise(resolve => process.conn.query('SELECT name FROM houses', (err, res) => {
            process.logError(err);
            resolve((res || []).map(v => this.parse(v).name));
        }));
    }

    /**
     * Creates a new House.
     * @return {Promise<object>} sql output
     */
    static async create(object)
    {
        // const { name, description, motto, invite_only, banner } = object;
        // let query = '';
        // for (const key in object) 
        // {
        //     const value = object[key];

        //     query += `${key} = `;

        //     switch (typeof value) {
        //         case 'boolean':
        //         case 'number':
        //             query += `${value}, `;
        //             break;
        //         case 'object':
        //             query += `'${value.join(',')}', `;
        //             break;
        //         default:
        //             query += `'${value}', `;
        //             break;
        //     };
        // }
        // query = query.slice(0, -2);

        object.xp = 0;
        object.banned = '';
        object.members = '';

        const ids = Object.keys(object).join(',');
        const values = Object.values(object).map(v => {
            switch (typeof v) {
                case 'boolean':
                case 'number':
                    return v;
                case 'object':
                    return `'${v.join(',')}'`;
                default:
                    return `'${v.replace(/'/gm,"''")}'`;
            };
        }).join(',');

        return new Promise(resolve => process.conn.query(`INSERT INTO houses (${ids}) VALUES (${values})`, (err, res) => {
            process.logError(err);
            resolve(res);
        }));
    }

    /**
     * Fetches the first House that matches the callback.
     * @param {function(object):boolean} callback
     * @param {string} selector default: *
     * @return {Promise<object>|Promise<undefined>}
     */
    static async find(callback, selector='*')
    {
        return new Promise(resolve => process.conn.query(`SELECT ${selector} FROM houses`, (err, res) => {
            process.logError(err);
            resolve(this.parse((res || []).find(callback)));
        }));
    }

    /**
     * Fetches all the houses that match the callback.
     * @param {function(object):boolean} callback
     * @param {string} selector default: *
     * @return {Promise<object[]>}
     */
    static async findAll(callback, selector='*')
    {
        return new Promise(resolve => process.conn.query(`SELECT ${selector} FROM houses`, (err, res) => {
            process.logError(err);
            resolve((res || []).filter(callback).map(v => this.parse(v)));
        }));
    }

    /**
     * Fetches a House that matches the name.
     * @param {string} name
     * @return {Promise<object>|Promise<undefined>}
     */
    static async fetch(name)
    {
        return Houses.find(v => v.name === name);
    }

    /** 
     * Edits a House property that matches the name.
     * @param {string|object} name
     * @param {string} keyValue
     * @param {string|boolean|number|string[]} value
     * @return {Promise<object>} sql output
     */
    static async edit(name, keyValue, value)
    {
        let query = `${keyValue} = `;
        switch (typeof value) {
            case 'boolean':
            case 'number':
                query += value;
                break;
            case 'object':
                query += `'${value.join(',')}'`;
                break;
            default:
                query += `'${value.replace(/'/gm,"''")}'`;
                break;
        };
        return new Promise(resolve => process.conn.query(`UPDATE houses SET ${query} WHERE name = '${name.name || name}'`, (err, res) => {
            process.logError(err);
            resolve(res);
        }));
    }
}

module.exports = Houses;