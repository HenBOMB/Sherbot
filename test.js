const arr = [150000, 100000, 75000, 50000, 25000, 10000, 5000, 1000].reverse();
const sent = 10;
const rp = 20;
const table = {};

for (let i = 0; i < arr.length; i++) 
{
  table[`${arr[i]}`] = {
    rp : sent * rp,
    left : arr[i] - (sent * rp),
    sent: sent,
    need: arr[i] / (sent * rp),
  }

  // sent 10 messages
  // rp required to next level: 800
}

console.clear();
console.log(`SENT: ${rp}`)
console.log(`RP: ${rp}`)
console.table(table, ['left', 'need']);