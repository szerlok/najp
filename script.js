const gridContainer = document.getElementById('grid-container');
const checkButton = document.getElementById('check-button');
const nextButton = document.getElementById('next-button');
const feedback = document.getElementById('feedback');
const endScreen = document.getElementById('end-screen');
const resultTable = document.getElementById('result-table');
const instruction = document.getElementById('instruction');  // Instrukcja
const roundCounter = document.getElementById('round-counter');  // Licznik rund

const rows = 12;
const cols = 12;
let greenPoints = [];
let selectedPoint = null;
let round = 0;
let perfectHits = 0; // Licznik perfekcyjnych trafień
let totalDifference = 0; // Suma różnic w każdej rundzie
const totalRounds = 10;
let lastTenResults = []; // Tablica ostatnich wyników (maksymalnie 10)

// Funkcja do losowania zielonych punktów (od 3 do 20)
function generateRandomGreenPoints() {
    const numGreenPoints = Math.floor(Math.random() * (20 - 3 + 1)) + 3;  // Losujemy liczbę od 3 do 20
    greenPoints = [];

    while (greenPoints.length < numGreenPoints) {
        const randomX = Math.floor(Math.random() * cols);
        const randomY = Math.floor(Math.random() * rows);

        // Sprawdzenie, czy punkt już nie istnieje w liście
        if (!greenPoints.some(point => point.x === randomX && point.y === randomY)) {
            greenPoints.push({ x: randomX, y: randomY });
        }
    }
}

// Tworzenie siatki
function createGrid() {
    gridContainer.innerHTML = '';  // Wyczyść siatkę na nową rundę
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.dataset.x = col;
            gridItem.dataset.y = row;

            // Dodanie zielonych punktów
            if (isGreenPoint(col, row)) {
                gridItem.classList.add('green');
            }

            // Obsługa kliknięcia punktu przez użytkownika
            gridItem.addEventListener('click', () => selectPoint(col, row, gridItem));

            gridContainer.appendChild(gridItem);
        }
    }
}

// Sprawdza, czy dany punkt jest zielony
function isGreenPoint(x, y) {
    return greenPoints.some(point => point.x === x && point.y === y);
}

// Zaznacza wybrany przez użytkownika punkt
function selectPoint(x, y, element) {
    if (selectedPoint) {
        selectedPoint.classList.remove('selected');
    }
    selectedPoint = element;
    selectedPoint.classList.add('selected');
}

// Oblicza dystans Euklidesowy
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Znajduje punkt najbliższy zielonym punktom
function findClosestPoint() {
    let minDistance = Infinity;
    let closestPoint = null;

    document.querySelectorAll('.grid-item').forEach(item => {
        const x = parseInt(item.dataset.x);
        const y = parseInt(item.dataset.y);

        // Punkt nie może być zielonym punktem
        if (isGreenPoint(x, y)) {
            return;
        }

        let totalDistance = 0;
        greenPoints.forEach(point => {
            totalDistance += calculateDistance(x, y, point.x, point.y);
        });

        if (totalDistance < minDistance) {
            minDistance = totalDistance;
            closestPoint = item;
        }
    });

    return closestPoint;
}

// Sprawdzenie wyboru użytkownika
checkButton.addEventListener('click', () => {
    if (!selectedPoint) {
        feedback.textContent = 'Wybierz punkt!';
        return;
    }

    const x = parseInt(selectedPoint.dataset.x);
    const y = parseInt(selectedPoint.dataset.y);

    const closestPoint = findClosestPoint();
    const correctX = parseInt(closestPoint.dataset.x);
    const correctY = parseInt(closestPoint.dataset.y);

    // Obliczamy całkowitą odległość dla wybranego punktu
    let userTotalDistance = 0;
    let correctTotalDistance = 0;
    greenPoints.forEach(point => {
        userTotalDistance += calculateDistance(x, y, point.x, point.y);
        correctTotalDistance += calculateDistance(correctX, correctY, point.x, point.y);
    });

    // Obliczanie różnicy i dodanie jej do sumy
    const difference = Math.abs(userTotalDistance - correctTotalDistance);
    totalDifference += difference;

    if (x === correctX && y === correctY) {
        feedback.textContent = `Gratulacje! Wybrałeś prawidłowy punkt. Całkowita odległość to: ${userTotalDistance.toFixed(2)}.`;
        perfectHits++;  // Zwiększenie liczby perfekcyjnych trafień
    } else {
        feedback.textContent = `Twoja odpowiedź: ${userTotalDistance.toFixed(2)} | Prawidłowa odpowiedź: ${correctTotalDistance.toFixed(2)} | Różnica: ${difference.toFixed(2)}`;
    }

    closestPoint.classList.add('correct');
    checkButton.disabled = true;
    nextButton.style.display = 'inline-block';  // Wyświetl przycisk "Następne"
});

// Obsługa przycisku "Następne"
nextButton.addEventListener('click', () => {
    nextRound();
    nextButton.style.display = 'none';  // Ukryj przycisk po przejściu do następnej rundy
    checkButton.disabled = false;
});

// Uruchamianie kolejnej rundy
function nextRound() {
    round++;
    updateRoundCounter();

    if (round < totalRounds) {
        feedback.textContent = '';
        selectedPoint = null;
        generateRandomGreenPoints();
        createGrid();
        if (round > 1) instruction.style.display = 'none';  // Ukryj instrukcję po pierwszej rundzie
    } else {
        endGame();
    }
}

// Zaktualizuj licznik rund
function updateRoundCounter() {
    roundCounter.textContent = `${round}/${totalRounds}`;
}

// Zakończenie gry i wyświetlenie wyniku końcowego
function endGame() {
    // Zapisywanie wyniku do lokalnej pamięci
    saveResult(totalDifference.toFixed(2), perfectHits);

    // Ukrywanie siatki i przycisków
    gridContainer.style.display = 'none';
    checkButton.style.display = 'none';
    nextButton.style.display = 'none';

    // Wyświetlenie wyników na nowym ekranie
    endScreen.style.display = 'block';
    endScreen.innerHTML = `
        <h2>Gra zakończona!</h2>
        <p>Twój wynik to: ${totalDifference.toFixed(2)}</p>
        <p>Perfekcyjne trafienia: ${perfectHits}</p>
        <h3>Ostatnie 10 wyników:</h3>
    `;

    // Wyświetlenie tabeli wyników
    displayResults();
}

// Zapis wyników w localStorage
function saveResult(difference, hits) {
    let results = JSON.parse(localStorage.getItem('results')) || [];
    results.unshift({ difference, hits });  // Dodaj nowy wynik na początek
    if (results.length > 10) results.pop();  // Usuwaj starsze wyniki, aby trzymać tylko 10

    localStorage.setItem('results', JSON.stringify(results));
}

// Wyświetlanie ostatnich 10 wyników w tabeli
function displayResults() {
    let results = JSON.parse(localStorage.getItem('results')) || [];
    resultTable.innerHTML = '';  // Wyczyść tabelę

    results.forEach((result, index) => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${index + 1}</td><td>${result.difference}</td><td>${result.hits}</td>`;
        resultTable.appendChild(row);
    });
}

// Inicjalizacja gry
function startGame() {
    round = 1;  // Ustawienie rundy na 1
    perfectHits = 0;  // Resetowanie liczby perfekcyjnych trafień
    totalDifference = 0;  // Resetowanie sumy różnic
    instruction.style.display = 'block';  //

    checkButton.disabled = false;
    nextButton.style.display = 'none';  // Ukryj przycisk "Następne" na początku
    generateRandomGreenPoints();
    createGrid();
}

startGame();
