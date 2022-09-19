const arr = [150000, 100000, 75000, 50000, 25000, 10000, 5000, 1000].reverse();
const sent = 10;
const rp = 20;
const table = {};

for (let i = 0; i < arr.length; i++) 
{
  table[`${arr[i]}`] = {
    rp : sent * rp,
    rp_left : arr[i] - (sent * rp),
    sent: sent,
    need: arr[i] / (sent * rp),
  }
}

console.table(table, ['rp', 'rp_left', 'need', 'sent']);