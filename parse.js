const fs = require('fs');

const raw = `Précédent record		1:41.93				00:48.70		00:49.99			00:50.05		01:44.16	
22/06/2024	00:41.27					00:47.53		00:48.54					01:37.00	
05/10/2024	00:39.11					00:45.56		00:48.01			00:45.21			
12/10/2024			03:06.08											
16/11/2024										03:17.59				
08/12/2024								00:45.57					01:31.65	
01/02/2025			02:58.00					00:45.60			00:42. 90			
08-09/03/2025		01:18.25					01:32.68		01:35.84			01:31.42		
29/03/2025						00:39.72					00:41.89		01:26.43	
10-11/05/2025		01:17.07		05:52.78				00:42.40				-	01:24.89	03:04.64
18/05/2025						00:38.41		00:43.94					01:25.08	
21-22/06/2025	00:35.57		02:51.39			00:39.73		00:41.40			00:42.32			03:02.48
04-05/10/2025		01:16.52					01:29.70		01:28.81			01:27.62		
11-12/10/2025	00:34.85			05:52.54		00:38.13		00:41.37			00:40.14		01:24.35	
14/12/2025								00.40:41					01.20:67	
31/01/2026						00:35.82					00:40.65			
01/02/2026	00:33.32							00.40:60						02:55.21
14/02/2026					11:36.00									
14/03/2026	00:32.19	01:10.87												
15/03/2026							01:26.25			02:59.32		01:23.13		
21/03/2026						00.35:48		00.39:30						02:47.27
22/03/2026			02.36:94						1:22.96				01:19.70	`;

const columns = [
    ['freestyle', 50],
    ['freestyle', 100],
    ['freestyle', 200],
    ['freestyle', 400],
    ['freestyle', 800],
    ['butterfly', 50],
    ['butterfly', 100],
    ['breaststroke', 50],
    ['breaststroke', 100],
    ['breaststroke', 200],
    ['backstroke', 50],
    ['backstroke', 100],
    ['medley', 100],
    ['medley', 200],
];

function uuid() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function parseTime(timeStr) {
    if (!timeStr || timeStr.trim() === '-' || timeStr.trim() === '') return null;
    let t = timeStr.trim().replace(/ /g, '');
    let parts = t.split(/[:.]/);
    if (parts.length === 3) {
        return parseInt(parts[0]) * 60000 + parseInt(parts[1]) * 1000 + parseInt(parts[2]) * 10;
    } else if (parts.length === 2) {
        return parseInt(parts[0]) * 1000 + parseInt(parts[1]) * 10;
    }
    return 0;
}

let meets = [];
let swimmer = {
    id: "swimmer_eliot",
    name: "Eliot",
    performances: []
};

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function makeMeet(dateStr) {
    if (dateStr === "Précédent record") {
        return { id: "meet_0", name: "Précédent record", startDate: "2024-01-01" };
    }
    let parts = dateStr.split('/');
    if (parts.length === 3) {
        let dayPart = parts[0];
        let month = parts[1];
        let year = parts[2];
        let monthName = months[parseInt(month)-1];
        if (dayPart.includes('-')) {
            let sDays = dayPart.split('-');
            let startDay = sDays[0];
            let endDay = sDays[1];
            let name = "Compétition - " + monthName + " " + year;
            return { id: "meet_" + dateStr.replace(/[-/]/g, ''), name: name, startDate: year + "-" + month + "-" + startDay.padStart(2, '0'), endDate: year + "-" + month + "-" + endDay.padStart(2, '0') };
        } else {
            let name = "Compétition - " + monthName + " " + year;
            return { id: "meet_" + dateStr.replace(/\//g, ''), name: name, startDate: year + "-" + month + "-" + dayPart.padStart(2, '0') };
        }
    }
    return null;
}

let lastMeet = null;
const lines = raw.trim().split('\n');

for (let line of lines) {
    let cells = line.split('\t');
    let dateStr = cells[0].trim();
    let meet = makeMeet(dateStr);

    if (meet && !meet.endDate && lastMeet) {
        let d1 = lastMeet.startDate.split('-');
        let d2 = meet.startDate.split('-');
        if (d1.length === 3 && d2.length === 3 && d1[0] === d2[0] && d1[1] === d2[1] && parseInt(d2[2]) === parseInt(d1[2]) + 1) {
            lastMeet.endDate = meet.startDate;
            meet = lastMeet;
        } else {
            meets.push(meet);
            lastMeet = meet;
        }
    } else {
        if (meet) {
            meets.push(meet);
            lastMeet = meet;
        }
    }

    for (let j = 0; j < cells.length - 1; j++) {
        if (j < columns.length) {
            let val = cells[j + 1];
            let ms = parseTime(val);
            if (ms) {
                swimmer.performances.push({
                    id: uuid(),
                    meetId: meet.id,
                    date: meet.startDate,
                    stroke: columns[j][0],
                    distance: columns[j][1],
                    poolLength: 25,
                    timeMs: ms
                });
            }
        }
    }
}

const out = { meets: meets, swimmers: [swimmer] };

if (!fs.existsSync('src/data')) fs.mkdirSync('src/data');
fs.writeFileSync('src/data/initialData.json', JSON.stringify(out, null, 2), 'utf8');

fs.writeFileSync('parsed_data.md', JSON.stringify(out, null, 2), 'utf8');
