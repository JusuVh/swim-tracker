import json
import re
import uuid

raw = """Précédent record		1:41.93				00:48.70		00:49.99			00:50.05		01:44.16	
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
22/03/2026			02.36:94						1:22.96				01:19.70	"""

columns = [
    ('freestyle', 50),
    ('freestyle', 100),
    ('freestyle', 200),
    ('freestyle', 400),
    ('freestyle', 800),
    ('butterfly', 50),
    ('butterfly', 100),
    ('breaststroke', 50),
    ('breaststroke', 100),
    ('breaststroke', 200),
    ('backstroke', 50),
    ('backstroke', 100),
    ('medley', 100),
    ('medley', 200),
]

def parse_time(time_str):
    if not time_str or time_str.strip() == '-' or time_str.strip() == '':
        return None
    time_str = time_str.strip().replace(' ', '')
    parts = re.split(r'[:.]', time_str)
    if len(parts) == 3:
        m, s, h = parts
        return int(m) * 60000 + int(s) * 1000 + int(h) * 10
    elif len(parts) == 2:
        s, h = parts
        return int(s) * 1000 + int(h) * 10
    else:
        return 0

meets = []
swimmer = {
    "id": "swimmer_eliot",
    "name": "Eliot",
    "performances": []
}

months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

def make_meet(date_str):
    name = "Précedent record"
    if date_str == "Précédent record":
        return {"id": "meet_0", "name": "Précédent record", "startDate": "2024-01-01"}
    
    parts = date_str.split('/')
    if len(parts) == 3:
        day_part = parts[0]
        month = parts[1]
        year = parts[2]
        if '-' in day_part:
            start_day, end_day = day_part.split('-')
            name = f"Compétition - {months[int(month)-1]} {year}"
            return {"id": "meet_" + date_str.replace('/',''), "name": name, "startDate": f"{year}-{month}-{start_day.zfill(2)}", "endDate": f"{year}-{month}-{end_day.zfill(2)}"}
        else:
            name = f"Compétition - {months[int(month)-1]} {year}"
            return {"id": "meet_" + date_str.replace('/',''), "name": name, "startDate": f"{year}-{month}-{day_part.zfill(2)}"}
    return None

last_meet = None

lines = raw.strip().split('\n')
for i, line in enumerate(lines):
    cells = line.split('\t')
    date_str = cells[0].strip()
    
    meet = make_meet(date_str)
    
    # consecutive days logic
    if meet and not 'endDate' in meet and last_meet:
        d1 = last_meet['startDate'].split('-')
        d2 = meet['startDate'].split('-')
        if len(d1)==3 and len(d2)==3 and d1[0] == d2[0] and d1[1] == d2[1] and int(d2[2]) == int(d1[2]) + 1:
            last_meet['endDate'] = meet['startDate']
            meet = last_meet
        else:
            meets.append(meet)
            last_meet = meet
    else:
        if meet:
            meets.append(meet)
            last_meet = meet
        
    for j, val in enumerate(cells[1:]):
        if j < len(columns):
            ms = parse_time(val)
            if ms:
                swimmer['performances'].append({
                    "id": str(uuid.uuid4()),
                    "meetId": meet['id'],
                    "date": meet['startDate'],
                    "stroke": columns[j][0],
                    "distance": columns[j][1],
                    "poolLength": 25,
                    "timeMs": ms
                })

import os
with open('c:/Users/j.vonhertzen/swim-tracker/assets/initialData.json', 'w', encoding='utf-8') as f:
    json.dump({"meets": meets, "swimmers": [swimmer]}, f, indent=2, ensure_ascii=False)
    
print("JSON Written successfully")
