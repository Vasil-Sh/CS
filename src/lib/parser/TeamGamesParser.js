(function () {
    let resultsBlocks = document.querySelectorAll('.results-sublist');
    let results = [];

    resultsBlocks.forEach(block => {
        // Get the date
        let dateText = block.querySelector('.standard-headline')?.innerText || '';

        // Iterate through each match
        let matches = block.querySelectorAll('.result-con');
        matches.forEach(match => {
            let link = match.querySelector('a.a-reset')?.getAttribute('href') || '';

            // Teams
            let team1 = match.querySelector('.team1 .team')?.innerText || '';
            let team2 = match.querySelector('.team2 .team')?.innerText || '';

            //// Scores
            //let score1 = match.querySelector('.team1 ~ .result-score span')?.innerText || '';
            //let score2 = match.querySelector('.team2 ~ .result-score span')?.innerText || '';

            // Actually, safer: use class names "score-won" and "score-lost"
            let scoreWon = match.querySelector('.score-won')?.innerText || '0';
            let scoreLost = match.querySelector('.score-lost')?.innerText || '0';

            // Determine which team won/lost
            let score1Int = parseInt(match.querySelector('.team1 .team')?.classList.contains('team-won') ? scoreWon : scoreLost, 10);
            let score2Int = parseInt(match.querySelector('.team2 .team')?.classList.contains('team-won') ? scoreWon : scoreLost, 10);

            // Stars
            let stars = match.querySelectorAll('.star-cell .star').length;

            // Map type
            let type = match.querySelector('.map-text')?.innerText || '';

            results.push({
                date: null,
                dateText: dateText,
                link: link,
                team1Name: team1,
                team2Name: team2,
                score1: score1Int,
                score2: score2Int,
                stars: stars,
                type: type
            });
        });
    });

    return results;
})();