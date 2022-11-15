module.exports = {
    async tick(message)
    {
        if(message.channel.id != '670108903224377354') 
            return;

        const content = message.content.toLowerCase();

        if(
            content.includes("my name is") || 
            content.includes("dms are") || 
            content.match(/i['’ ]m .{3,}/gm) || 
            content.match(/i am .{3,}/gm) ||
            content.match(/name:.{3,}/gm) ||
            content.match(/contacts:.{3,}/gm)
        )
        {
            return await message.react('👋');
        }

        const filtered = content.replace(/\W+/gm,' ').replace(/  /gm, ' ');

        if(
            filtered.includes("my name is") || 
            filtered.includes("dms are") || 
            filtered.match(/i['’ ]m .{3,}/gm) || 
            filtered.match(/i am .{3,}/gm) ||
            filtered.match(/name:.{3,}/gm) ||
            filtered.match(/contacts:.{3,}/gm)
        )
        {
            return await message.react('👋');
        }
    },
};