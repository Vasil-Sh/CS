// Debug script to check goals and bet data
const currentUser = localStorage.getItem('currentUser') || '';

console.log('=== DEBUG: GOALS AND BETS ===');
console.log('Current User:', currentUser);

// Check goals
const goalsKey = `${currentUser}_goals`;
const goalsData = localStorage.getItem(goalsKey);
console.log('\n📊 Goals in localStorage:');
if (goalsData) {
  const goals = JSON.parse(goalsData);
  console.log('Total goals:', goals.length);
  goals.forEach((goal, index) => {
    console.log(`\nGoal ${index + 1}:`);
    console.log('  ID:', goal.id);
    console.log('  Name:', goal.name);
    console.log('  Status:', goal.status);
    console.log('  Type:', goal.type);
  });
} else {
  console.log('No goals found');
}

// Check latest bet
const betsKey = `${currentUser}_mybets_data`;
const betsData = localStorage.getItem(betsKey);
console.log('\n\n💰 Latest Bet:');
if (betsData) {
  const bets = JSON.parse(betsData);
  const latestBet = bets[bets.length - 1];
  console.log('Match:', latestBet.match || `${latestBet.team1} vs ${latestBet.team2}`);
  console.log('Date:', latestBet.date);
  console.log('Odds:', latestBet.odds);
  console.log('goalId:', latestBet.goalId || 'NOT SET ❌');
  console.log('\nFull bet object:');
  console.log(JSON.stringify(latestBet, null, 2));
} else {
  console.log('No bets found');
}

console.log('\n=== END DEBUG ===');
