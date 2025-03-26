document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const playerCountInput = document.getElementById('playerCount');
    const generatePlayerFieldsBtn = document.getElementById('generatePlayerFields');
    const playerInputsContainer = document.getElementById('playerInputs');
    const startTournamentBtn = document.getElementById('startTournament');
    const resetTournamentBtn = document.getElementById('resetTournament');
    const tournamentSection = document.querySelector('.tournament-section');
    const setupSection = document.querySelector('.setup-section');
    const tournamentTreeContainer = document.getElementById('tournamentTree');
    const winnerOverlay = document.getElementById('winnerOverlay');
    const winnerNameElement = document.getElementById('winnerName');
    const closeWinnerOverlayBtn = document.getElementById('closeWinnerOverlay');

    // Globale Variablen
    let players = [];
    let matches = [];
    let roundCount = 0;

    // Event Listeners
    generatePlayerFieldsBtn.addEventListener('click', generatePlayerInputFields);
    startTournamentBtn.addEventListener('click', startTournament);
    resetTournamentBtn.addEventListener('click', resetTournament);
    closeWinnerOverlayBtn.addEventListener('click', hideWinnerAnimation);

    // Spieler-Eingabefelder generieren
    function generatePlayerInputFields() {
        const playerCount = parseInt(playerCountInput.value);
        
        if (playerCount < 2) {
            alert('Bitte geben Sie mindestens 2 Spieler ein.');
            return;
        }
        
        if (playerCount > 64) {
            alert('Maximal 64 Spieler erlaubt.');
            return;
        }
        
        playerInputsContainer.innerHTML = '';
        
        for (let i = 1; i <= playerCount; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.classList.add('player-input');
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `player${i}`;
            input.placeholder = `Spieler ${i}`;
            input.required = true;
            
            playerDiv.appendChild(input);
            playerInputsContainer.appendChild(playerDiv);
        }
        
        startTournamentBtn.style.display = 'block';
    }

    // Turnier starten
    function startTournament() {
        // Sammle Spielernamen aus den Eingabefeldern
        players = [];
        const playerInputs = playerInputsContainer.querySelectorAll('input');
        
        for (const input of playerInputs) {
            const name = input.value.trim();
            if (name) {
                players.push({ name, score: 0 });
            }
        }
        
        if (players.length < 2) {
            alert('Bitte geben Sie mindestens 2 Spielernamen ein.');
            return;
        }
        
        // Mischen der Spieler für zufällige Paarungen
        shufflePlayers();
        
        // Turnierbaum initialisieren
        setupTournament();
        
        // Ansicht wechseln
        setupSection.style.display = 'none';
        tournamentSection.style.display = 'block';
    }
    
    // Spielerliste zufällig mischen (Fisher-Yates Algorithmus)
    function shufflePlayers() {
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
    }
    
    // Turnierbaum aufbauen
    function setupTournament() {
        tournamentTreeContainer.innerHTML = '';
        matches = [];
        
        // Anzahl der Runden berechnen (log2 aufgerundet)
        const playerCount = players.length;
        roundCount = Math.ceil(Math.log2(playerCount));
        
        // Berechnen der Anzahl der Spiele in der ersten Runde
        const totalPositions = Math.pow(2, roundCount);
        const firstRoundMatches = totalPositions / 2;
        const byes = totalPositions - playerCount;
        
        // Runden und Spiele erstellen
        createTournamentStructure();
        
        // Optimierte Verteilung der Spieler mit Freilosen
        assignPlayersWithByes(byes, firstRoundMatches);
        
        // Verbindungslinien zwischen den Paarungen zeichnen
        drawConnectors();
    }
    
    // Turnierbaum-Struktur erstellen
    function createTournamentStructure() {
        // Für jede Runde einen Container erstellen
        for (let round = 0; round < roundCount; round++) {
            const roundDiv = document.createElement('div');
            roundDiv.classList.add('round');
            roundDiv.dataset.round = round;
            
            const roundTitle = document.createElement('h3');
            
            if (round === 0) {
                roundTitle.textContent = 'Erste Runde';
            } else if (round === roundCount - 1) {
                roundTitle.textContent = 'Finale';
            } else if (round === roundCount - 2) {
                roundTitle.textContent = 'Halbfinale';
            } else if (round === roundCount - 3) {
                roundTitle.textContent = 'Viertelfinale';
            } else {
                roundTitle.textContent = `Runde ${round + 1}`;
            }
            
            roundDiv.appendChild(roundTitle);
            
            // Berechnen der Anzahl der Spiele in dieser Runde
            const matchCount = Math.pow(2, roundCount - round - 1);
            
            // Spiele für diese Runde erstellen
            for (let i = 0; i < matchCount; i++) {
                const matchDiv = document.createElement('div');
                matchDiv.classList.add('match');
                matchDiv.dataset.round = round;
                matchDiv.dataset.match = i;
                
                // Match-Objekt erstellen und speichern
                const match = {
                    round: round,
                    matchIndex: i,
                    player1: null,
                    player2: null,
                    winner: null,
                    element: matchDiv,
                    bye: false // Markierung für Freilos
                };
                
                matches.push(match);
                
                // Spieler-Elemente hinzufügen (werden später gefüllt)
                const player1Div = document.createElement('div');
                player1Div.classList.add('player', 'player1');
                player1Div.textContent = 'TBD';
                player1Div.addEventListener('click', () => selectWinner(match, 0));
                
                const player2Div = document.createElement('div');
                player2Div.classList.add('player', 'player2');
                player2Div.textContent = 'TBD';
                player2Div.addEventListener('click', () => selectWinner(match, 1));
                
                matchDiv.appendChild(player1Div);
                matchDiv.appendChild(player2Div);
                
                roundDiv.appendChild(matchDiv);
            }
            
            tournamentTreeContainer.appendChild(roundDiv);
        }
    }
    
    // Optimierte Verteilung der Spieler mit Freilosen
    function assignPlayersWithByes(byes, firstRoundMatches) {
        // Array mit den Positionen der Matches in der ersten Runde erstellen
        let positions = [];
        for (let i = 0; i < firstRoundMatches; i++) {
            positions.push(i);
        }
        
        // Die Spieler mischen
        const shuffledPlayers = [...players];
        shuffleArray(shuffledPlayers);
        
        // Wenn es keine Freilose gibt, einfach alle Spieler auf die Matches verteilen
        if (byes === 0) {
            // Spiele der ersten Runde auswählen
            const firstRoundMatchObjects = matches.filter(match => match.round === 0);
            
            // Spieler auf die Matches verteilen
            let playerIndex = 0;
            for (const match of firstRoundMatchObjects) {
                const matchElement = match.element;
                
                // Spieler 1 setzen
                if (playerIndex < shuffledPlayers.length) {
                    match.player1 = shuffledPlayers[playerIndex];
                    const player1Element = matchElement.querySelector('.player1');
                    player1Element.textContent = shuffledPlayers[playerIndex].name;
                    playerIndex++;
                }
                
                // Spieler 2 setzen
                if (playerIndex < shuffledPlayers.length) {
                    match.player2 = shuffledPlayers[playerIndex];
                    const player2Element = matchElement.querySelector('.player2');
                    player2Element.textContent = shuffledPlayers[playerIndex].name;
                    playerIndex++;
                }
            }
            return;
        }
        
        // Optimierte Verteilung mit Freilosen
        // Diese Strategie basiert auf einer "Seeding"-Struktur, die in Turnieren verwendet wird
        
        // Berechnen der optimalen Verteilung der Freilose
        let byePositions = [];
        let activePositions = [];
        
        // Für einen optimalen Turnierbaum teilen wir die Positionen nach dem "Power of 2" Prinzip ein
        // Die Freilose werden so verteilt, dass sie in der nächsten Runde ausgeglichene Paarungen ergeben
        const nearestPowerOf2 = Math.pow(2, Math.floor(Math.log2(players.length)));
        const excessPlayers = players.length - nearestPowerOf2;
        
        // Berechne die Positionen für die Freilose
        if (excessPlayers > 0) {
            // Erstelle ein Array mit allen möglichen Positionen
            const allPositions = Array.from({ length: firstRoundMatches }, (_, i) => i);
            
            // Shuffle das Array für eine zufällige Verteilung der Startpositionen
            shuffleArray(allPositions);
            
            // Wähle so viele Positionen wie notwendig
            byePositions = allPositions.slice(0, byes);
            activePositions = allPositions.filter(pos => !byePositions.includes(pos));
        } else {
            activePositions = Array.from({ length: firstRoundMatches }, (_, i) => i);
        }
        
        // Spiele der ersten Runde auswählen
        const firstRoundMatchObjects = matches.filter(match => match.round === 0);
        
        // Spieler auf aktive Matches verteilen
        let playerIndex = 0;
        for (const pos of activePositions) {
            const match = firstRoundMatchObjects[pos];
            const matchElement = match.element;
            
            // Spieler 1 setzen
            if (playerIndex < shuffledPlayers.length) {
                match.player1 = shuffledPlayers[playerIndex];
                const player1Element = matchElement.querySelector('.player1');
                player1Element.textContent = shuffledPlayers[playerIndex].name;
                playerIndex++;
            }
            
            // Spieler 2 setzen
            if (playerIndex < shuffledPlayers.length) {
                match.player2 = shuffledPlayers[playerIndex];
                const player2Element = matchElement.querySelector('.player2');
                player2Element.textContent = shuffledPlayers[playerIndex].name;
                playerIndex++;
            }
        }
        
        // Freilose setzen
        for (const pos of byePositions) {
            const match = firstRoundMatchObjects[pos];
            const matchElement = match.element;
            
            // Wenn noch Spieler übrig sind, bekommen sie ein Freilos
            if (playerIndex < shuffledPlayers.length) {
                // Player 1 setzen, Player 2 ist Freilos
                match.player1 = shuffledPlayers[playerIndex];
                match.player2 = null;
                match.bye = true;
                match.winner = shuffledPlayers[playerIndex];
                
                const player1Element = matchElement.querySelector('.player1');
                player1Element.textContent = shuffledPlayers[playerIndex].name;
                player1Element.classList.add('winner', 'free-pass');
                
                const player2Element = matchElement.querySelector('.player2');
                player2Element.textContent = 'Freilos';
                player2Element.classList.add('bye');
                
                // Spieler mit Freilos automatisch weitergeben
                advanceWinnerWithoutBye(match);
                
                playerIndex++;
            }
        }
    }
    
    // Gewinner in die nächste Runde befördern, ohne weitere Freilose zu setzen
    function advanceWinnerWithoutBye(match) {
        if (!match.winner || match.round >= roundCount - 1) return;
        
        // Nächstes Match finden
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const nextMatch = matches.find(m => m.round === nextRound && m.matchIndex === nextMatchIndex);
        
        if (!nextMatch) return;
        
        // Bestimmen, ob der Gewinner der erste oder zweite Spieler im nächsten Match wird
        const isFirstPlayer = match.matchIndex % 2 === 0;
        
        // Spieler zum nächsten Match hinzufügen
        if (isFirstPlayer) {
            nextMatch.player1 = match.winner;
            const playerElement = nextMatch.element.querySelector('.player1');
            playerElement.textContent = match.winner.name;
        } else {
            nextMatch.player2 = match.winner;
            const playerElement = nextMatch.element.querySelector('.player2');
            playerElement.textContent = match.winner.name;
        }
        
        // Prüfen, ob durch den neuen Spieler ein Freilos entsteht
        checkForBye(nextMatch);
        
        // Verbindungslinien neu zeichnen
        drawConnectors();
    }
    
    // Hilfsfunktion zum Mischen eines Arrays (Fisher-Yates Algorithmus)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Verbindungslinien zwischen den Paarungen zeichnen
    function drawConnectors() {
        // Verzögerung zum Sicherstellen, dass DOM aktualisiert ist
        setTimeout(() => {
            // Alle vorherigen Connector entfernen
            document.querySelectorAll('.connector-vertical').forEach(el => el.remove());
            
            for (let round = 0; round < roundCount - 1; round++) {
                const currentRoundMatches = matches.filter(match => match.round === round);
                const nextRoundMatches = matches.filter(match => match.round === round + 1);
                
                for (let i = 0; i < nextRoundMatches.length; i++) {
                    const nextMatch = nextRoundMatches[i];
                    const nextMatchElement = nextMatch.element;
                    
                    // Finde die beiden vorherigen Matches, die zu diesem Match führen
                    const prevMatchIndex1 = i * 2;
                    const prevMatchIndex2 = i * 2 + 1;
                    
                    if (prevMatchIndex1 < currentRoundMatches.length) {
                        const prevMatch1 = currentRoundMatches[prevMatchIndex1];
                        const prevMatchElement1 = prevMatch1.element;
                        
                        drawVerticalConnector(prevMatchElement1, nextMatchElement, true);
                    }
                    
                    if (prevMatchIndex2 < currentRoundMatches.length) {
                        const prevMatch2 = currentRoundMatches[prevMatchIndex2];
                        const prevMatchElement2 = prevMatch2.element;
                        
                        drawVerticalConnector(prevMatchElement2, nextMatchElement, false);
                    }
                }
            }
        }, 200);
    }
    
    // Vertikale Verbindungslinie zwischen zwei Matches zeichnen
    function drawVerticalConnector(fromMatchElement, toMatchElement, isTop) {
        const fromRect = fromMatchElement.getBoundingClientRect();
        const toRect = toMatchElement.getBoundingClientRect();
        
        const connector = document.createElement('div');
        connector.classList.add('connector-vertical');
        
        const parentRound = fromMatchElement.parentElement;
        const parentRoundRect = parentRound.getBoundingClientRect();
        
        // Position und Größe der Verbindungslinie berechnen
        const startY = fromRect.top + fromRect.height / 2 - parentRoundRect.top;
        const endY = toRect.top + toRect.height / 2 - parentRoundRect.top;
        
        // Vertikale Linie positionieren
        connector.style.top = `${Math.min(startY, endY)}px`;
        connector.style.height = `${Math.abs(endY - startY)}px`;
        
        parentRound.appendChild(connector);
    }
    
    // Gewinner in die nächste Runde befördern
    function advanceWinner(match) {
        if (!match.winner || match.round >= roundCount - 1) return;
        
        // Nächstes Match finden
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const nextMatch = matches.find(m => m.round === nextRound && m.matchIndex === nextMatchIndex);
        
        if (!nextMatch) return;
        
        // Bestimmen, ob der Gewinner der erste oder zweite Spieler im nächsten Match wird
        const isFirstPlayer = match.matchIndex % 2 === 0;
        
        // Spieler zum nächsten Match hinzufügen
        if (isFirstPlayer) {
            nextMatch.player1 = match.winner;
            const playerElement = nextMatch.element.querySelector('.player1');
            playerElement.textContent = match.winner.name;
        } else {
            nextMatch.player2 = match.winner;
            const playerElement = nextMatch.element.querySelector('.player2');
            playerElement.textContent = match.winner.name;
        }
        
        // Prüfen, ob durch den neuen Spieler ein Freilos entsteht
        checkForBye(nextMatch);
        
        // Verbindungslinien neu zeichnen
        drawConnectors();
    }
    
    // Prüfen, ob ein Match ein Freilos enthält
    function checkForBye(match) {
        if (match.bye) return; // Bereits als Freilos markiert
        
        // Prüfe, ob ein Spieler gegen ein Freilos spielen müsste
        let byeDetected = false;
        let winningPlayer = null;
        let winningPlayerElement = null;
        let byePlayerElement = null;
        
        if (match.player1 && !match.player2) {
            // Spieler 1 ist da, Spieler 2 fehlt
            // Prüfen, ob für Spieler 2 ein Gegner kommen kann
            const prevMatchIndex = match.matchIndex * 2 + 1;
            const prevRound = match.round - 1;
            
            // Gibt es ein entsprechendes vorheriges Match?
            const prevMatch = prevRound >= 0 ? 
                matches.find(m => m.round === prevRound && m.matchIndex === prevMatchIndex) : null;
            
            // Wenn es kein vorheriges Match gibt oder es ein Freilos war
            if (!prevMatch || (prevMatch && prevMatch.bye)) {
                byeDetected = true;
                winningPlayer = match.player1;
                winningPlayerElement = match.element.querySelector('.player1');
                byePlayerElement = match.element.querySelector('.player2');
            }
        } else if (!match.player1 && match.player2) {
            // Spieler 2 ist da, Spieler 1 fehlt
            // Prüfen, ob für Spieler 1 ein Gegner kommen kann
            const prevMatchIndex = match.matchIndex * 2;
            const prevRound = match.round - 1;
            
            // Gibt es ein entsprechendes vorheriges Match?
            const prevMatch = prevRound >= 0 ? 
                matches.find(m => m.round === prevRound && m.matchIndex === prevMatchIndex) : null;
            
            // Wenn es kein vorheriges Match gibt oder es ein Freilos war
            if (!prevMatch || (prevMatch && prevMatch.bye)) {
                byeDetected = true;
                winningPlayer = match.player2;
                winningPlayerElement = match.element.querySelector('.player2');
                byePlayerElement = match.element.querySelector('.player1');
            }
        }
        
        // Bei einem Freilos automatisch weitergeben
        if (byeDetected && winningPlayer) {
            // Freilos markieren
            byePlayerElement.textContent = 'Freilos';
            byePlayerElement.classList.add('bye');
            
            // Gewinner markieren
            match.bye = true;
            match.winner = winningPlayer;
            winningPlayerElement.classList.add('winner', 'free-pass');
            
            // In die nächste Runde befördern
            advanceWinner(match);
        }
    }
    
    // Gewinner auswählen, wenn ein Spieler angeklickt wird
    function selectWinner(match, playerIndex) {
        // Prüfen, ob ein Spieler vorhanden ist
        const selectedPlayer = playerIndex === 0 ? match.player1 : match.player2;
        if (!selectedPlayer || match.bye) return;
        
        // Prüfen, ob bereits ein Gewinner festgelegt wurde
        if (match.winner) {
            // Gewinner-Status zurücksetzen
            const player1Element = match.element.querySelector('.player1');
            const player2Element = match.element.querySelector('.player2');
            
            player1Element.classList.remove('winner');
            player2Element.classList.remove('winner');
            
            // Nachfolgende Matches zurücksetzen
            resetSubsequentMatches(match);
        }
        
        // Neuen Gewinner festlegen
        match.winner = selectedPlayer;
        
        // Visuelle Markierung des Gewinners
        const playerElement = match.element.querySelector(playerIndex === 0 ? '.player1' : '.player2');
        playerElement.classList.add('winner');
        
        // Gewinner in die nächste Runde befördern
        advanceWinner(match);
        
        // Wenn dies das Finale ist, zeige die Gewinner-Animation
        if (match.round === roundCount - 1) {
            showWinnerAnimation(match.winner);
        }
    }
    
    // Nachfolgende Matches zurücksetzen, wenn ein Gewinner geändert wird
    function resetSubsequentMatches(match) {
        if (match.round >= roundCount - 1) return;
        
        // Nächstes Match finden
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const nextMatch = matches.find(m => m.round === nextRound && m.matchIndex === nextMatchIndex);
        
        if (!nextMatch) return;
        
        // Bestimmen, ob der Spieler der erste oder zweite Spieler im nächsten Match ist
        const isFirstPlayer = match.matchIndex % 2 === 0;
        
        // Wenn das nächste Match bereits einen Gewinner hat, den Status zurücksetzen
        if (nextMatch.winner) {
            // Setze den Gewinnerstatus zurück
            const player1Element = nextMatch.element.querySelector('.player1');
            const player2Element = nextMatch.element.querySelector('.player2');
            
            player1Element.classList.remove('winner', 'free-pass');
            player2Element.classList.remove('winner', 'free-pass');
            nextMatch.winner = null;
            nextMatch.bye = false;
        }
        
        // Den Freilos-Status zurücksetzen, falls es einer war
        nextMatch.bye = false;
        
        // Spieler aus dem nächsten Match entfernen, der von diesem Match kam
        if (isFirstPlayer) {
            nextMatch.player1 = null;
            const playerElement = nextMatch.element.querySelector('.player1');
            playerElement.textContent = 'TBD';
            playerElement.classList.remove('winner', 'free-pass');
            
            // Wenn der zweite Spieler Freilos war, auch zurücksetzen
            if (nextMatch.player2 === null) {
                const player2Element = nextMatch.element.querySelector('.player2');
                if (player2Element.classList.contains('bye')) {
                    player2Element.textContent = 'TBD';
                    player2Element.classList.remove('bye');
                }
            }
        } else {
            nextMatch.player2 = null;
            const playerElement = nextMatch.element.querySelector('.player2');
            playerElement.textContent = 'TBD';
            playerElement.classList.remove('winner', 'free-pass');
            
            // Wenn der erste Spieler Freilos war, auch zurücksetzen
            if (nextMatch.player1 === null) {
                const player1Element = nextMatch.element.querySelector('.player1');
                if (player1Element.classList.contains('bye')) {
                    player1Element.textContent = 'TBD';
                    player1Element.classList.remove('bye');
                }
            }
        }
        
        // Rekursiv auch nachfolgende Matches zurücksetzen
        resetSubsequentMatches(nextMatch);
        
        // Verbindungslinien neu zeichnen
        drawConnectors();
    }
    
    // Gewinner-Animation anzeigen
    function showWinnerAnimation(winner) {
        // Name des Gewinners setzen
        winnerNameElement.textContent = winner.name;
        
        // Konfetti erstellen mit mehreren Wellen für voluminöseres Erlebnis
        createConfetti();
        
        // Weitere Konfetti-Wellen hinzufügen
        setTimeout(() => {
            if (document.querySelector('.winner-overlay.show')) {
                createConfetti(true); // Zweite Welle
            }
        }, 2000);
        
        setTimeout(() => {
            if (document.querySelector('.winner-overlay.show')) {
                createConfetti(true); // Dritte Welle
            }
        }, 4000);
        
        // Animation anzeigen
        winnerOverlay.classList.add('show');
    }
    
    // Gewinner-Animation ausblenden
    function hideWinnerAnimation() {
        winnerOverlay.classList.remove('show');
        
        // Konfetti entfernen
        const confettiContainer = document.getElementById('confettiContainer');
        confettiContainer.innerHTML = '';
    }
    
    // Konfetti für die Animation erstellen
    function createConfetti(isSecondaryWave = false) {
        const confettiContainer = document.getElementById('confettiContainer');
        const colors = ['#ff4e50', '#fc913a', '#f9d62e', '#4bc09e', '#6077e2', '#6c4675', '#eb78a8', '#f875aa', '#36d399', '#9055ff'];
        
        // Lösche vorhandenes Konfetti nur bei der ersten Welle
        if (!isSecondaryWave) {
            confettiContainer.innerHTML = '';
        }
        
        // Erzeuge Konfetti-Stücke (weniger für Folgewellen)
        const count = isSecondaryWave ? 300 : 500;
        
        // Erzeugen Sie die Konfetti-Elemente
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('winner-confetti');
            
            // Zufällige Position, Farbe, Größe und Form
            const xPos = Math.random() * 100; // Prozentuale Position für bessere Verteilung
            const yPos = Math.random() * 20 - 20; // Startposition variieren
            const size = Math.random() * 12 + 5; // 5-17px Größe für größere Partikel
            const color = colors[Math.floor(Math.random() * colors.length)];
            const delay = Math.random() * 8; // 0-8s Verzögerung für längere Animation
            const duration = Math.random() * 5 + 3; // 3-8s Dauer
            const wind = (Math.random() - 0.5) * 400; // Noch stärkerer Windeffekt
            
            // Zufällige Chance für großes, schillerndes Konfetti (5% Chance)
            const isLarge = Math.random() < 0.05;
            if (isLarge) {
                confetti.classList.add('large');
                // Setze die Gradient-Farben als CSS-Variablen
                const color1 = colors[Math.floor(Math.random() * colors.length)];
                const color2 = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.setProperty('--color1', color1);
                confetti.style.setProperty('--color2', color2);
            }
            
            // Setze Konfetti-Eigenschaften
            confetti.style.left = `${xPos}%`;
            confetti.style.top = `${yPos}%`;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = color;
            confetti.style.animationDelay = `${delay}s`;
            confetti.style.animationDuration = `${duration}s`;
            confetti.style.setProperty('--wind', `${wind}px`);
            
            // Bei Folgewellen andere Parameter für die Verteilung
            if (isSecondaryWave) {
                // Andere Startpositionen für Folgewellen
                confetti.style.top = `${yPos * 2}%`;
                
                // Andere Verzögerungen für kontinuierliches Nachladen
                confetti.style.animationDelay = `${Math.random() * 3}s`;
            }
            
            // Für jedes 13. Konfetti-Element den Farbverlauf hinzufügen
            if (i % 13 === 0 && !isLarge) {
                const color1 = colors[Math.floor(Math.random() * colors.length)];
                const color2 = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.setProperty('--color1', color1);
                confetti.style.setProperty('--color2', color2);
            }
            
            // Zufällige Formen mit mehr Variationen
            // (nur für nicht-große Konfetti, da große ihren eigenen Stil haben)
            if (!isLarge) {
                const shapes = ['circle', 'square', 'rectangle', 'triangle', 'star'];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                
                if (shape === 'circle') {
                    confetti.style.borderRadius = '50%';
                } else if (shape === 'square') {
                    confetti.style.borderRadius = `${Math.random() * 3}px`;
                } else if (shape === 'rectangle') {
                    // Rechteckiges Konfetti
                    confetti.style.width = `${size * 0.5}px`;
                    confetti.style.height = `${size * 1.5}px`;
                    confetti.style.borderRadius = `${Math.random() * 2}px`;
                } else if (shape === 'triangle') {
                    // Dreieckiges Konfetti mit CSS
                    confetti.style.backgroundColor = 'transparent';
                    confetti.style.width = '0';
                    confetti.style.height = '0';
                    confetti.style.borderLeft = `${size/2}px solid transparent`;
                    confetti.style.borderRight = `${size/2}px solid transparent`;
                    confetti.style.borderBottom = `${size}px solid ${color}`;
                } else if (shape === 'star') {
                    // Stern-ähnliches Konfetti (einfache Version)
                    confetti.style.backgroundColor = 'transparent';
                    confetti.style.width = `${size}px`;
                    confetti.style.height = `${size}px`;
                    confetti.style.transform = 'rotate(45deg)';
                    confetti.style.border = `${size/8}px solid ${color}`;
                }
                
                // Zufällige Rotation und Skalierung am Anfang
                const rotation = Math.random() * 360;
                const scale = 0.8 + Math.random() * 0.6; // 0.8 - 1.4
                confetti.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            }
            
            // Zufällige Opazität für mehr Tiefe
            confetti.style.opacity = 0.7 + Math.random() * 0.3; // 0.7 - 1.0
            
            confettiContainer.appendChild(confetti);
        }
    }
    
    // Turnier zurücksetzen
    function resetTournament() {
        tournamentSection.style.display = 'none';
        setupSection.style.display = 'block';
    }
}); 