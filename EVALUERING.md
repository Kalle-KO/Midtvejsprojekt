# Elevator Scheduling Algorithms - Project Evaluation

Det har været interessant at lege med disse tre algoritmer gennem dette projekt. Vi har både fået bekræftet og afkræftet forventninger til, hvordan de ville opføre sig.

Vi har sat tre scenarier op, som tester vores algoritmer, hvor vi kan se, med vores forskellige metrikker, hvilken en der er bedst i hvert scenarie.

## Test Scenarier

Af scenarier har vi:
- **Baseline test**
- **Rush hour (morning commute)**
- **Floor hogging (short trips)**

## Metrikker

Af metrikker der måles, har vi:
- Total moves
- Average wait
- Maximum wait

---

## FCFS - First Come First Served

FCFS er den algoritme vi har taget med, som bevidst var ment som værende den dårligste af dem alle. Det har også vist sig at være unuanceret godt. Den markant værre end både SCAN og Rush hour i alle scenarier. Dette gør den naturligvis fordi opererer ineffektivt, ved at samle gæster op efter hvilken rækkefølge de har kaldt elevatoren. Dette resulterer i, at elevatoren kan gå fra 1. sal til 7. sal og tilbage ned til 3. sal og så videre. Vi kan derfor observere i metrikkerne, når algoritmerne er færdige, at FCFS har betydeligt højere total moves, og wait (steps).

---

## SCAN

Vi havde en forventning til, at vores Rush Hour algoritme ville være bedre end SCAN, som minimum i vores Rush hour scenarie. Dog har det vist sig at de fleste tests præsterer helt ens. Indimellem er den ene bedre end den anden, men det er sjældent.

SCAN-algoritmen fungerer som en klassisk elevator der kører op og ned i bygningen. Den fortsætter i samme retning indtil der ikke er flere anmodninger, hvorefter den vender om og kører den modsatte vej. SCAN registrerer kun hvilke etager der har anmodninger - den tager ikke højde for om folk vil op eller ned, men servicerer bare alle etager den passerer.

---

## Rush Hour Optimization

Rush Hour Optimization bygger videre på SCAN, men tilføjer retningsbevidsthed. I stedet for bare at vide hvilke etager der har anmodninger, husker Rush Hour også om folk vil op eller ned. Tanken er at prioritere gæster der skal i samme retning som elevatoren allerede kører. I en morgensituation hvor mange står på de nederste etager og skal op, burde Rush Hour kunne samle flere op effektivt, fordi den ved hvilke anmodninger der matcher dens nuværende retning.

---

## Problemstilling

Problemet i vores implementation er at begge algoritmer stadig servicerer alle anmodninger på en etage når de passerer forbi, uanset hvilken retning folk skal. Så selv om Rush Hour ved om folk vil op eller ned, bruger den ikke rigtigt den information til at træffe bedre beslutninger.

Forskellen ville være mere tydelig hvis Rush Hour kun optog passagerer der skal samme vej som elevatoren kører, og lod andre vente på næste tur - men det ville også give længere ventetider for nogle passagerer.

---

## Konklusion

Så vi er altså ultimativt kommet frem til at **SCAN**, som er den mest normale elevator-algoritme, ikke kan optimeres ret meget i de fleste tilfælde. Rush Hour og SCAN opfører sig i praksis næsten ens, hvilket gør at de får disse lignende metrikker, på trods af at Rush Hour i teorien burde være bedre til at håndtere eksempelvis morgentrafik med dens retningsbaseret trafik.