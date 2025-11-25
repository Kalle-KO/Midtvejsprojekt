# Elevator Scheduling Algorithms - Project Evaluation

Det har været interessant at lege med disse tre algoritmer gennem dette projekt. Vi har både fået bekræftet og afkræftet forventninger til, hvordan de ville opføre sig.

Vi har sat tre scenarier op, som tester vores algoritmer, hvor vi kan se, med vores forskellige metrikker, hvilken en der er bedst i hvert scenarie.

## Test Scenarier

Af scenarier har vi:
- **Baseline test** - Balanceret trafik på tværs af alle etager
- **Rush hour (morning commute)** - Morgentrafik med tæt klynge i bunden og kontinuerlige ankomster øverst
- **Floor hogging (short trips)** - Korte ture der monopoliserer elevatoren, med populære etager

## Metrikker

Af metrikker der måles, har vi:
- **Total moves** - Totale antal etage-bevægelser elevatoren har foretaget
- **Average wait** - Gennemsnitlig ventetid for gæster (målt i steps)
- **Maximum wait** - Maksimal ventetid for en enkelt gæst (målt i steps)
- **Requests served** - Antal gæster der er blevet serviceret

Da gæsterne i vores simulation ikke har en dropoff destination, er alle test lavet i continuous mode, først til 100 requests served.

---

## Test Resultater

### Baseline Test

| Algoritme | Total Moves | Avg Wait (steps) | Max Wait (steps) | Requests Served |
|-----------|-------------|------------------|------------------|-----------------|
| SSTF      | 152         | 9                | 35               | 100             |
| SCAN      | 153         | 9                | 31               | 98              |
| FCFS      | 199         | 61               | 116              | 55              |

**Observationer:**
I vores baseline scenarie med tilfældig trafik præsterer SSTF og SCAN næsten identisk. SSTF gennemfører 152 moves mod SCAN's 153, og begge har en gennemsnitlig ventetid på 9 steps. Den største forskel ses i max wait, hvor SCAN klarer sig lidt bedre (31 steps vs. 35 steps), hvilket tyder på at SCAN er mere fair overfor gæster der er på de øverste og nederste etager. FCFS er som forventet markant dårligere med 199 moves og en gennemsnitlig ventetid på 61 steps, næsten 7 gange højere end de optimerede algoritmer. FCFS når kun at servicere 55 gæster i samme tidsramme, hvilket viser hvor ineffektiv den er til at håndtere selv balanceret trafik.

---

### Rush Hour (Morning Commute)

| Algoritme | Total Moves | Avg Wait (steps) | Max Wait (steps) | Requests Served |
|-----------|-------------|------------------|------------------|-----------------|
| SSTF      | 39          | 16               | 48               | 100             |
| SCAN      | 44          | 19               | 57               | 95              | 
| FCFS      | 103         | 52               | 98               | 36              |

**Observationer:**
Rush hour scenariet viser den mest dramatiske forskel mellem algoritmerne. SSTF udmærker sig her med kun 39 total moves ift til SCAN's 44 moves. Dette skyldes at SSTF kan udnytte den tætte mængde af anmodninger ved de nederste etager meget effektivt ved at "campe" hvor trafikken er. 
FCFS kollapser totalt i dette scenarie med 103 moves og kun 36 servicerede gæster.

---

### Floor Hogging (Short Trips)

| Algoritme | Total Moves | Avg Wait (steps) | Max Wait (steps) | Requests Served |
|-----------|-------------|------------------|------------------|-----------------|
| SSTF      | 102         | 7                | 55               | 100             |
| SCAN      | 106         | 9                | 38               | 100             |
| FCFS      | 141         | 47               | 75               | 72              |


**Observationer:**
Floor hogging scenariet skulle teoretisk set favorisere SSTF, da den kan blive ved de populære etager (etage 1 og 5). Tallene viser at SSTF er marginalt bedre med 102 moves mod SCAN's 106, og en gennemsnitlig ventetid på 7 steps mod 9 steps.
Ift max wait: SSTF's værste gæst venter 55 steps, mens SCAN's værste kun venter 38 steps. Dette bekræfter SSTF's starvation-problem. Selvom den servicerer de populære etager hurtigt, kan gæster på upopulære etager blive ignoreret i længere tid. SCAN's sweep garanterer at alle etager bliver besøgt regelmæssigt. FCFS servicerer kun 72 gæster og har meget høj average wait (47 steps).

---

## FCFS - First Come First Served

FCFS er den algoritme vi har taget med, som bevidst var ment som værende den dårligste af dem alle. Det har også vist sig at være unuanceret dårlig. Den er markant værre end både SCAN og SSTF i alle scenarier. Dette sker naturligvis fordi den opererer ineffektivt, ved at samle gæster op efter hvilken rækkefølge de har kaldt elevatoren. Dette resulterer i, at elevatoren kan gå fra 1. sal til 7. sal og tilbage ned til 3. sal og så videre. Vi kan derfor observere i metrikkerne, når algoritmerne er færdige, at FCFS har betydeligt højere total moves, og wait (steps).

FCFS tjener som vores baseline for at vise hvor meget algoritme-optimering kan forbedre elevator-performance.

---

## SCAN

SCAN-algoritmen fungerer som en klassisk elevator der kører op og ned i bygningen. Den fortsætter i samme retning indtil der ikke er flere anmodninger, hvorefter den vender om og kører den modsatte vej. SCAN registrerer kun hvilke etager der har anmodninger - den tager ikke højde for om folk vil op eller ned, men servicerer bare alle etager den passerer.

SCAN er den mest anvendte elevator-algoritme i praksis fordi den er:
- **Forudsigelig** - Gæster kan regne med at elevatoren kommer forbi
- **Fair** - Ingen gæster bliver "glemt" eller overset
- **Effektiv** - Minimerer unødvendig bevægelse ved at servicere alle anmodninger i samme retning

I vores tests viser SCAN sig at være den mest konsistente og pålidelige algoritme på tværs af de tre scenarier. Den har ikke de absolut laveste gennemsnitstal, men den har konsekvent de laveste max wait times, hvilket viser at ingen gæster bliver "glemt". SCAN's styrke ligger i forudsigeligheden og følelsen af fairhed. Alle etager bliver besøgt.

---

## SSTF - Shortest Seek Time First

SSTF (Shortest Seek Time First) er en "greedy" algoritme der altid vælger den nærmeste anmodning. Hver gang elevatoren skal beslutte hvor den skal køre hen, kigger den på alle ventende anmodninger og vælger den etage der er tættest på.

Fordele ved SSTF:

Minimerer total bevægelse i scenarier med klyngede anmodninger.
Meget effektiv når anmodningerne er tæt på hinanden (fx floor hogging).
Potentielt lavere gennemsnitlig ventetid i optimale forhold.

Ulemper ved SSTF:

Kan "campe" ved populære etager og ignorere de fjerne anmodninger
Risiko for starvation: gæster langt væk kan vente meget længe
Uforudsigelig opførsel for gæsterne

I vores tests viser SSTF sig at være den mest effektive til at minimere gennemsnitlig ventetid og totale bevægelser, især i rush hour scenariet. Dog kommer denne effektivitet med en pris: SSTF har konsekvent højere max wait times end SCAN, hvilket viser at nogle gæster bliver ofret for at optimere gennemsnittet. SSTF er bedst når man vil minimere den totale tid for flertallet, men ikke når fairness er vigtig.

---

## SSTF vs SCAN - Sammenligning

Vi havde en forventning til, at SSTF ville være bedre end SCAN i scenarier med klynget trafik, som for eksempel floor hogging scenariet hvor mange anmodninger kommer fra samme etager. 

[Indsæt dine observationer her - blev SSTF bedre i floor hogging? Var SCAN mere konsistent? Hvilke trade-offs observerede I?]

Den fundamentale forskel mellem algoritmerne er:
- **SSTF optimerer for gennemsnitlig ventetid** ved at være "greedy" og vælge nærmeste anmodning
- **SCAN optimerer for forudsigelighed og fairness** ved at servicere alle i samme retning

I praksis betyder det at:
- SSTF kan give bedre gennemsnitlige tal, men med risiko for ekstreme outliers
- SCAN giver mere konsistente tal med færre overraskelser

---

## Konklusion

Gennem vores tests af de tre algoritmer på tværs af forskellige scenarier kan vi konkludere følgende:

## Hvilken algoritme var generelt bedst?

  Det afhænger af hvad man vil optimere for:

  Hvis målet er lavest gennemsnitlig ventetid og færrest moves: SSTF vinder, især i rush hour scenariet (39 moves, 16 avg wait)
  Hvis målet er fairness og forudsigelighed + hurtig performance: SCAN vinder med konsekvent lavere max wait times (31-57 steps vs. 35-55 steps), samt stadigvæk at være kompetitiv på de andre metrics

## FCFS vs. optimerede algoritmer:
FCFS er som forventet markant dårligere end både SSTF og SCAN. I baseline test har FCFS 61 steps average wait sammenlignet med 9 steps for de optimerede algoritmer, næsten 7 gange værre. FCFS når kun at servicere 55-72 gæster i samme tidsramme hvor SSTF og SCAN servicerer 95-100 gæster. Dette demonstrerer tydeligt værdien af algoritme-optimering.

---

## Projektets begrænsninger:

Vores simulation har ikke destinations (dropoff floors), hvilket betyder at gæster "forsvinder" når de bliver samlet op. I en rigtig elevator ville dette ændre algoritmernes opførsel betydeligt. Især SSTF ville kunne få problemer med at beslutte om den skal prioritere nye pickups eller færdiggøre eksisterende passagerers rejser. SCAN ville forblive konsistent da den servicerer både pickups og dropoffs under sit sweep.

Alle vores tests er kørt i continuous mode til præcis 100 servicerede gæster for at sikre fair sammenligning. Dette giver os dynamiske scenarier hvor algoritmernes forskelle kommer tydeligt frem, i statiske scenarier hvor alle anmodninger er kendt på forhånd ville SSTF og SCAN præstere næsten identisk.

---

## Fremtidige Forbedringer

Der er flere måder projektet kunne udvides på:

1. Destinations (dropoff floors)
Lige nu "forsvinder" gæster når elevatoren samler dem op. I virkeligheden har gæster destinations, hvilket ville:

Gøre SCAN endnu mere forudsigelig (servicerer både pickups og dropoffs under sweep)
Komplicere SSTF's beslutningslogik (skal den prioritere nearby pickups eller færdiggøre eksisterende passagerers ture?)
Tilføje nye metrics: "ride time", "total trip time"

2. Elevator kapacitet
Tilføje maksimal kapacitet så elevatoren ikke kan tage alle på en etage på én gang.

   
