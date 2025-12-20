(function () {
    let result = {
        coach: null,
        players: []
    };

    // ----- COACH -----
    let coachWrapper = document.querySelector('.teamCoach-wrapper');
    if (coachWrapper) {
        let row = coachWrapper.querySelector('tbody tr');
        if (row) {
            let name = row.querySelector('.text-ellipsis')?.innerText.trim() || '';
            let time = row.querySelectorAll('td')[1].innerText.replace(/\n+/g, ' ').trim() || '';
            let mapsCount = row.querySelectorAll('td')[2]?.innerText.trim() || '0';
            let trophies = row.querySelectorAll('td')[3]?.innerText.trim() || '0';
            let winrate = row.querySelectorAll('td')[4]?.innerText.trim().replace('%', '') || '0';

            result.coach = {
                id: 0,
                teamName: '',
                name,
                strTimeInTeam: time,
                daysInTeam: 0,
                mapsCount: parseInt(mapsCount),
                trophies: parseInt(trophies),
                winrate: parseInt(winrate)
            };
        }
    }

    // ----- PLAYERS -----
    let playersWrapper = document.querySelector('.playersBox-wrapper');
    if (playersWrapper) {
        let rows = playersWrapper.querySelectorAll('tbody tr');
        rows.forEach(row => {
            let name = row.querySelector('.text-ellipsis')?.innerText.trim() || '';
            let time = row.querySelectorAll('td')[2].innerText.replace(/\n+/g, ' ').trim() || '';
            let mapsCount = row.querySelectorAll('td')[3]?.innerText.trim() || '0';
            let rating = row.querySelectorAll('td')[4]?.innerText.replace(/\n/g, '').replaceAll('*', '').trim() || '0';

            result.players.push({
                id: 0,
                teamName: '',
                name,
                strTimeInTeam: time,
                daysInTeam: 0,
                mapsCount: parseInt(mapsCount),
                rating: parseFloat(rating)
            });
        });
    }

    return result;
})();
