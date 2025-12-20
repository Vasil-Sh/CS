(function () {
    let boxes = document.querySelectorAll('.mapholder');
    let results = [];

//    console.clear();

    boxes.forEach(box => {
        // Map name
        let mapName = box.querySelector('.mapname')?.innerText.trim() || '';

        // Left team
        let leftBlock = box.querySelector('.results-left');
        let team1Name = leftBlock?.querySelector('.results-teamname')?.innerText.trim() || '';
        let team1Won = leftBlock.classList.contains('won');
        let team1Lost = leftBlock.classList.contains('lost');
        let team1Picked = leftBlock.classList.contains('pick');
        let team1Score = parseInt(leftBlock?.querySelector('.results-team-score')?.innerText.replace("-", "").trim() || '0', 10) || 0;

        // Right team
        let rightBlock = box.querySelector('.results-right');
        let team2Name = rightBlock?.querySelector('.results-teamname')?.innerText.trim() || '';
        let team2Won = rightBlock.classList.contains('won');
        let team2Lost = rightBlock.classList.contains('lost');
        let team2Picked = rightBlock.classList.contains('pick');
        let team2Score = parseInt(rightBlock?.querySelector('.results-team-score')?.innerText.replace("-", "").trim() || '0', 10) || 0;

        let scoreSpans = Array.from(box.querySelectorAll('.results-center-half-score span'));

        // Part1 Team1
        var spanPart1Score1 = scoreSpans[1];
        var part1Team1Score = parseInt(spanPart1Score1?.innerText || '0', 10) || 0;
        let part1Team1Side = spanPart1Score1?.classList.contains("ct") ? "ct" :
            spanPart1Score1?.classList.contains("t") ? "t" : "-";

        // Part1 Team2
        var spanPart1Score2 = scoreSpans[3];
        var part1Team2Score = parseInt(spanPart1Score2?.innerText || '0', 10) || 0;
        let part1Team2Side = spanPart1Score2?.classList.contains("ct") ? "ct" :
            spanPart1Score2?.classList.contains("t") ? "t" : "-";

        // Part2 Team1
        var spanPart2Score1 = scoreSpans[5];
        var part2Team1Score = parseInt(spanPart2Score1?.innerText || '0', 10) || 0;
        let part2Team1Side = spanPart2Score1?.classList.contains("ct") ? "ct" :
            spanPart2Score1?.classList.contains("t") ? "t" : "-";

        // Part2 Team2
        var spanPart2Score2 = scoreSpans[7];
        var part2Team2Score = parseInt(spanPart2Score2?.innerText || '0', 10) || 0;
        let part2Team2Side = spanPart2Score2?.classList.contains("ct") ? "ct" :
            spanPart2Score2?.classList.contains("t") ? "t" : "-";

        // Part3 Team1
        var spanPart3Score1 = scoreSpans[11];
        var part3Team1Score = parseInt(spanPart3Score1?.innerText || '0', 10) || 0;

        // Part3 Team2
        var spanPart3Score2 = scoreSpans[13];
        var part3Team2Score = parseInt(spanPart3Score2?.innerText || '0', 10) || 0;

        results.push({
            MapName: mapName,
            Link: '',
            GameNumber: 0,

            // Player 1
            Player1Name: team1Name,
            Player1Score: team1Score,
            Player1Lost: team1Lost,
            Player1Won: team1Won,
            Player1Pick: team1Picked,
            Player1Score1: part1Team1Score,
            Player1Side1: part1Team1Side,
            Player1Score2: part2Team1Score,
            Player1Side2: part2Team1Side,
            Player1Score3: part3Team1Score,
            Player1Side3: "-",

            // Player 2
            Player2Name: team2Name,
            Player2Score: team2Score,
            Player2Lost: team2Lost,
            Player2Won: team2Won,
            Player2Pick: team2Picked,
            Player2Score1: part1Team2Score,
            Player2Side1: part1Team2Side,
            Player2Score2: part2Team2Score,
            Player2Side2: part2Team2Side,
            Player2Score3: part3Team2Score,
            Player2Side3: "-"
        });
    });

    //console.log(JSON.stringify(results, null, 2));

    return results;
})();