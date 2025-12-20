(function () {
    let boxes = document.querySelectorAll('.two-grid > .col');
    let results = [];

//    console.clear();

    for (const box of boxes) {
        let mapName = box.querySelector('.map-pool-map-name')?.innerText.trim() || '';

        // Skip this box if no map name is found
        if (!mapName)
            continue;

        // Find stats rows
        const rows = Array.from(box.querySelectorAll('.stats-row'));
        const getValue = (label) =>
            rows.find(r => r.querySelector('.strong')?.innerText.includes(label))
                ?.querySelector('span:not(.strong)')?.innerText.trim() || '';

        // Extract data
        const winsDrawsLosses = getValue('Wins / draws / losses'); // e.g. "10 / 0 / 5"
        const winRateText = getValue('Win rate');                  // e.g. "66.7%"
        const totalRoundsText = getValue('Total rounds');          // e.g. "316"
        const pickPercentText = getValue('Pick %');                // e.g. "21.1%"
        const banPercentText = getValue('Ban %');                  // e.g. "5.4%"

        // Parse W/D/L
        let [wins, draws, losses] = winsDrawsLosses.split('/')
            .map(v => parseInt(v.trim()) || 0);

        // Convert percentage strings to numbers
        const parsePercent = (val) => parseFloat(val.replace('%', '').trim()) || 0;

        results.push({
            MapName: mapName,
            WinsCount: wins,
            DrawsCount: draws,
            LossesCount: losses,
            WinRatePercent: parsePercent(winRateText),
            TotalRounds: parseInt(totalRoundsText) || 0,
            PickPercent: parsePercent(pickPercentText),
            BanPercent: parsePercent(banPercentText)
        });
    }

    //console.log(JSON.stringify(results, null, 2));

    return results;
})();