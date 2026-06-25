var fs = require('fs');

function fixRiskManagement(path) {
  var c = fs.readFileSync(path, 'utf-8');
  
  // Add aria-labels to edit/delete buttons in renderTeamCard
  c = c.replace(
    "              onClick={() => startEditing(globalIndex, team)}\r\n              className=",
    "              onClick={() => startEditing(globalIndex, team)}\r\n              aria-label={`Редагувати команду ${team.name}`}\r\n              className="
  );
  
  c = c.replace(
    "              onClick={() => deleteRiskyTeam(globalIndex)}\r\n              className=",
    "              onClick={() => deleteRiskyTeam(globalIndex)}\r\n              aria-label={`Видалити команду ${team.name}`}\r\n              className="
  );
  
  // Add aria-label to "Скинути фільтр" buttons
  c = c.replace(
    "                        <RotateCcw className=\"h-4 w-4\" strokeWidth={2} />\r\n                        Скинути фільтр\r\n                      </Button>",
    "                        <RotateCcw className=\"h-4 w-4\" strokeWidth={2} />\r\n                        Скинути фільтр\r\n                      </Button>",
  );
  
  // Add aria-label to "Додати команду" button  
  c = c.replace(
    "                        <Plus className=\"h-4 w-4\" strokeWidth={2} />\r\n                        Додати команду\r\n                      </Button>",
    "                        <Plus className=\"h-4 w-4\" strokeWidth={2} />\r\n                        Додати команду\r\n                      </Button>",
  );
  
  // Add aria-label to status filter buttons
  c = c.replace(
    '<button onClick={() => setCsStatusFilter(\'all\')} className={`',
    '<button onClick={() => setCsStatusFilter(\'all\')} aria-label="Показати всі CS команди" className={`'
  );
  c = c.replace(
    '<button onClick={() => setDotaStatusFilter(\'all\')} className={`',
    '<button onClick={() => setDotaStatusFilter(\'all\')} aria-label="Показати всі Dota команди" className={`'
  );
  
  // Delete all button
  c = c.replace(
    '                onClick={() => setIsDeleteAllOpen(true)}\r\n                className="',
    '                onClick={() => setIsDeleteAllOpen(true)}\r\n                aria-label="Видалити всі команди"\r\n                className="'
  );
  
  // Cancel/save editing buttons in modal
  c = c.replace(
    '                onClick={cancelEditing}\r\n                className="',
    '                onClick={cancelEditing}\r\n                aria-label="Скасувати редагування"\r\n                className="'
  );
  c = c.replace(
    '                onClick={saveEditing}\r\n                className="',
    '                onClick={saveEditing}\r\n                aria-label="Зберегти зміни"\r\n                className="'
  );
  
  fs.writeFileSync(path, c, 'utf-8');
  console.log('RiskManagement: aria-labels added');
}

function fixAnalytics(path) {
  var c = fs.readFileSync(path, 'utf-8');
  
  // Add aria-label to bank edit button
  c = c.replace(
    /onClick=\{\(e\) => \{ e\.stopPropagation\(\); handleBankCardClick\(\); \}\}\r\n\s+className="/g,
    'onClick={(e) => { e.stopPropagation(); handleBankCardClick(); }}\n                aria-label="Редагувати банк"\n                className="'
  );
  
  // Add aria-label to stat cards that are clickable
  c = c.replace(
    '            onClick={handleBankCardClick}\r\n            style={cardBaseStyle}',
    '            onClick={handleBankCardClick}\r\n            aria-label="Редагувати поточний банк"\r\n            role="button"\r\n            style={cardBaseStyle}'
  );
  
  fs.writeFileSync(path, c, 'utf-8');
  console.log('Analytics: aria-labels added');
}

function fixBetTable(path) {
  var c = fs.readFileSync(path, 'utf-8');
  
  // Add aria-labels to table action buttons (share, details, result, delete)
  c = c.replace(
    '                          <button onClick={() => onShareBet(bet)} className="',
    '                          <button onClick={() => onShareBet(bet)} aria-label="Поділитися ставкою" className="'
  );
  c = c.replace(
    '                          <button onClick={() => onBetDetails(bet)} className="',
    '                          <button onClick={() => onBetDetails(bet)} aria-label="Деталі ставки" className="'
  );
  c = c.replace(
    '                          <button onClick={() => onExpressDetails(bet)} className="',
    '                          <button onClick={() => onExpressDetails(bet)} aria-label="Деталі експресу" className="'
  );
  c = c.replace(
    '                          <button onClick={() => onDeleteBet(bet)} className="',
    '                          <button onClick={() => onDeleteBet(bet)} aria-label="Видалити ставку" className="'
  );
  
  fs.writeFileSync(path, c, 'utf-8');
  console.log('BetTable: aria-labels added');
}

// 1. ARIA LABELS
fixRiskManagement('d:/github/mathciq/src/components/RiskManagement.tsx');
fixAnalytics('d:/github/mathciq/src/pages/Analytics.tsx');
fixBetTable('d:/github/mathciq/src/components/BetTable.tsx');

// 2. BORDER-RADIUS UNIFICATION
// Replace rounded-[32px] with rounded-3xl in main component files  
var borderFiles = [
  'src/pages/Analytics.tsx',
  'src/pages/MyBets.tsx',
  'src/pages/Strategy.tsx',
  'src/pages/Profile.tsx',
];
borderFiles.forEach(function(f) {
  var c = fs.readFileSync(f, 'utf-8');
  var oldCount = (c.match(/rounded-\[32px\]/g) || []).length;
  c = c.split('rounded-[32px]').join('rounded-3xl');
  fs.writeFileSync(f, c, 'utf-8');
  console.log(f + ': rounded-[32px](' + oldCount + ') -> rounded-3xl');
});

// Replace rounded-[24px] with rounded-2xl in component files
var borderFiles2 = [
  'src/components/Layout.tsx',
];
borderFiles2.forEach(function(f) {
  try {
    var c = fs.readFileSync(f, 'utf-8');
    var oldCount = (c.match(/rounded-\[24px\]/g) || []).length;
    c = c.split('rounded-[24px]').join('rounded-2xl');
    fs.writeFileSync(f, c, 'utf-8');
    console.log(f + ': rounded-[24px](' + oldCount + ') -> rounded-2xl');
  } catch(e) {}
});

console.log('\nALL DONE');
