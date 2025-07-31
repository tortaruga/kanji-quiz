// DOM variables
const levelBtns = document.querySelectorAll('.levels button');
const optionBtns = document.querySelectorAll('.answers button');
const resultsImg = document.querySelector('.result-message img'); 
// variables
let kanjiList = [];
let questions = [];
let index;
let correctScore = 0;
let incorrectScore = 0;
let pendingRetry = null; // for retrying fetching questions automatically after lost connection 


// quiz logic
async function getJLPTKanji(level) {
    const url = `https://kanjiapi.dev/v1/kanji/jlpt-${level}`;
    const response = await fetch(url, {cache: 'no-store'});

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const kanjiList = await response.json();
    return kanjiList;
}

async function getKanjiDetails(kanji) {
    const url = `https://kanjiapi.dev/v1/kanji/${kanji}`;
    const response = await fetch(url);
    const kanjiDetails = await response.json();
   
    return kanjiDetails;
}

levelBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    
    toggleActive(document.querySelector('.loader'));
    toggleActive(document.querySelector('.intro'));

    try {
      kanjiList = await getJLPTKanji(btn.id);
      toggleActive(document.querySelector('.loader')); // show loader
      startQuiz(); 
    } catch (error) {
      toggleActive(document.querySelector('.loader'));
      toggleActive(document.querySelector('.error-message'));
      
      if (error instanceof TypeError && !navigator.onLine) {
        document.querySelector('.error-message p').textContent = 'You appear to be offline. Please check your internet connection.';
      } else {
        document.querySelector('.error-message p').textContent = 'There seems to be an issue. Please try again later.';
      }
      console.error(error);
    }
  });
});

function startQuiz() {
    toggleActive(document.querySelector('.quiz'));

    index = 0;
    // select 25 random questions from chosen level kanji list
    questions = getRandomElements(kanjiList, 25);
    
    displayQuestion(questions, index);
}

async function displayQuestion(questions, index) {
    resetOptionAnimation(); 
    updateQuestionCount(index, questions);
    
    try {
        const kanjiDetails = await getKanjiDetails(questions[index]);

        // display kanji and readings
        document.querySelector('.kanji').innerHTML = questions[index];
        document.querySelector('.kun').innerHTML = kanjiDetails['kun_readings'].join(', ') || '–';
        document.querySelector('.on').innerHTML = kanjiDetails['on_readings'].join(', ') || '–';
    
        const correctAnswer = kanjiDetails.meanings;
    
        // choose 3 random wrong answers (making sure the correct answer is not among them)
        const filteredList = kanjiList.filter(kanji => kanji !== questions[index]);
        const options = getRandomElements(filteredList, 3); 
        let incorrectAnswers = [];
        
        // grab details for the 3 random kanji 
        const detailsPromises = options.map(async (option) => {
        const optionDetails = await getKanjiDetails(option);
          return optionDetails.meanings;
        });

        incorrectAnswers = await Promise.all(detailsPromises);
    
        displayOptions(correctAnswer, incorrectAnswers, questions);
        pendingRetry = null; 
    
        } catch (error) {
            toggleActive(document.querySelector('.offline-alert'));

            if (error instanceof TypeError && !navigator.onLine) {
            document.querySelector('.offline-alert').textContent = 'Oh, no! It seems you\'re offline... Check your connection and try again.';
            pendingRetry = () => displayQuestion(questions, index); // handle automatic retry
          } else {
            document.querySelector('.offline-alert').textContent = 'Something went wrong...';
          }
        }
}

// retry fetching when the connection comes back
window.addEventListener('online', () => {
  toggleActive(document.querySelector('.offline-alert')); 
  console.log('back online')
  if (pendingRetry) {
    pendingRetry();
  }
});


function displayOptions(correctAnswer, incorrectAnswers, questions) {
    // shuffle options so the correct answer isn't always the first one
    const allAnswers = shuffleArray([[correctAnswer], ...incorrectAnswers]);
   
    optionBtns.forEach((btn, i) => {
        btn.textContent = allAnswers[i].toString().replaceAll(',', ', ');
        // use event delegation on options container to handle user's answer
        document.querySelector('.answers').onclick = (e) => checkUserAnswer(e, correctAnswer, questions);
    }) 
}

function checkUserAnswer(e, correctAnswer, questions) {
    // handle click on the container
    if (!e.target.matches('button')) return;

    // find the button containing the correct answer
    const rightOption = Array.from(optionBtns).find(option => option.textContent.replaceAll(', ', ',') == correctAnswer);
   
    if (e.target.textContent.replaceAll(', ', ',') == correctAnswer) {
        correctScore++;
        updateScore(document.querySelector('.correct-score'), correctScore);
        e.target.classList.add('correct'); // visual feedback
        
    } else {
        incorrectScore++;   
        updateScore(document.querySelector('.incorrect-score'), incorrectScore);
        e.target.classList.add('incorrect'); // visual feedback
        rightOption.classList.add('correct'); // highlight correct answer
    }

    setTimeout(() => {
        if (index < questions.length - 1) {
            index++;
            displayQuestion(questions, index);
        } else {
            finishQuiz(questions);
        }
    }, 1000)
}

function finishQuiz(questions) {
    toggleActive(document.querySelector('.results'));
    toggleActive(document.querySelector('.quiz'));

    resultsImg.style.animation = 'rightAnswerAnimation .8s'; 
    const score = ((correctScore / questions.length) * 100).toFixed(0);
    document.querySelector('.score').textContent = `${score}%`;
    document.querySelector('.message').textContent = handleResultMessage(score);
}

function handleResultMessage(score) {
    if (score < 50) {
        return 'Don\'t give up! 💪​'; 
    } else if (score < 75) {
        return 'Keep going! 🎉';
    } else if (score < 90) {
        return 'You\'re crushing it! 🎖️​'; 
    } else if (score <= 100) {
        return 'You\'re a pro! 🏆';
    }
}

function restartGame() {

    toggleActive(document.querySelector('.results'));
    toggleActive(document.querySelector('.intro'));

    resultsImg.style.animation = 'none';

    incorrectScore = 0;
    correctScore = 0;
    updateScore(document.querySelector('.correct-score'), correctScore);
    updateScore(document.querySelector('.incorrect-score'), incorrectScore);
    index = 0; 
}

document.querySelector('.play-again-btn').addEventListener('click', restartGame);


// more info modal
document.getElementById('more-info-btn').addEventListener('click', () => {
    toggleActive(document.querySelector('.more-info-modal'));
})

document.querySelector('.close-modal').addEventListener('click', () => {
    toggleActive(document.querySelector('.more-info-modal'));

})

// utility functions  
function resetOptionAnimation() {
    if (document.querySelector('.correct')) {
        document.querySelector('.correct').classList.remove('correct');
    }

    if (document.querySelector('.incorrect')) {
        document.querySelector('.incorrect').classList.remove('incorrect');
    }
}

function updateScore(element, score) {
    element.textContent = score;
}

function updateQuestionCount(index, questions) {
    document.querySelector('.question-count').textContent = `${index + 1}/${questions.length}`;
}

function toggleActive(element) {
    element.classList.toggle('active');
}

function getRandomElements(arr, n) {
    const shuffledArray = shuffleArray(arr);
    return shuffledArray.slice(0, n);
}

function shuffleArray(arr) {
    // iterate from last to first element
    for (let i = arr.length - 1; i > 0; i--) {
        // choose a random element among those that haven't been swapped yet (index from 0 to current element)
        const j = Math.floor(Math.random() * (i + 1));
        // swap it with current element
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
