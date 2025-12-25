// Script to check goals and bets data
const currentUser = localStorage.getItem('currentUser') || '';

console.log('=== CHECKING GOALS AND BETS DATA ===');
console.log('Current User:', currentUser);

// Get goals
const goalsKey = `${currentUser}_goals`;
const goalsData = localStorage.getItem(goalsKey);
console.log('\n📊 Goals Data:', goalsData);

if (goalsData) {
  const goals = JSON.parse(goalsData);
  console.log('\n🎯 Active Goals:');
  goals.forEach(goal => {
    if (goal.status === 'active') {
      console.log(`\n  Goal: ${goal.name}`);
      console.log(`  ID: ${goal.id}`);
      console.log(`  Type: ${goal.type}`);
      if (goal.type === 'ladder') {
        console.log(`  Odds Range: ${goal.minOdds} - ${goal.maxOdds}`);
        console.log(`  Current Step: ${goal.currentStep}/${goal.totalSteps}`);
      }
    }
  });
}

// Get bets
const betsKey = `${currentUser}_mybets_data`;
const betsData = localStorage.getItem(betsKey);
console.log('\n\n💰 Bets Data:', betsData);

if (betsData) {
  const bets = JSON.parse(betsData);
  console.log(`\n📈 Total Bets: ${bets.length}`);
  console.log('\n🎲 Bet Details:');
  bets.forEach((bet, index) => {
    console.log(`\n  Bet ${index + 1}:`);
    console.log(`    Match: ${bet.match || `${bet.team1} vs ${bet.team2}`}`);
    console.log(`    Odds: ${bet.odds}`);
    console.log(`    Result: ${bet.result}`);
    console.log(`    goalId: ${bet.goalId || 'NOT SET ❌'}`);
    console.log(`    Date: ${bet.date}`);
  });
  
  // Check which bets have goalId
  const betsWithGoal = bets.filter(b => b.goalId);
  const betsWithoutGoal = bets.filter(b => !b.goalId);
  
  console.log(`\n\n✅ Bets with goalId: ${betsWithGoal.length}`);
  console.log(`❌ Bets without goalId: ${betsWithoutGoal.length}`);
}

console.log('\n=== END OF CHECK ===');
