let kanjiList = [];
let questions = [];
let index;
let correctScore = 0;
let incorrectScore = 0;
let pendingRetry = null;



async function getJLPTKanji(level) {
    const url = `https://kanjiapi.dev/v1/kanji/jlpt-${level}`;
    const response = await fetch(url, {cache: 'no-store'});

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const kanjiList = await response.json();
    return kanjiList;
}

const levelBtns = document.querySelectorAll('.levels button');

levelBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    toggleActive(document.querySelector('.loader'));
    toggleActive(document.querySelector('.intro'));

    try {
      kanjiList = await getJLPTKanji(btn.id);
      toggleActive(document.querySelector('.loader'));
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
    questions = getRandomElements(kanjiList, 25);
    
    displayQuestion(questions, index);
}

function resetOptionAnimation() {
    if (document.querySelector('.correct')) {
        document.querySelector('.correct').classList.remove('correct');
    }

    if (document.querySelector('.incorrect')) {
        document.querySelector('.incorrect').classList.remove('incorrect');
    }
}

async function displayQuestion(questions, index) {
    resetOptionAnimation();
    updateQuestionCount(index, questions);
    
    try {
    const kanjiDetails = await getKanjiDetails(questions[index]);

    document.querySelector('.kanji').innerHTML = questions[index];
    document.querySelector('.kun').innerHTML = kanjiDetails['kun_readings'].join(', ') || '–';
    document.querySelector('.on').innerHTML = kanjiDetails['on_readings'];
    
    const correctAnswer = kanjiDetails.meanings;
    let incorrectAnswers = [];
    let options = [];

    do {
        options = getRandomElements(kanjiList, 3);
    } while (
        options.some(option => option.kanji === questions[index])
    )

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
        pendingRetry = () => displayQuestion(questions, index);
      } else {
        document.querySelector('.offline-alert').textContent = 'Something went wrong...';
      }
    }
}

window.addEventListener('online', () => {
  toggleActive(document.querySelector('.offline-alert')); 
  console.log('back online')
  if (pendingRetry) {
    pendingRetry();
  }
});


function displayOptions(correctAnswer, incorrectAnswers, questions) {
    const allAnswers = shuffleArray([[correctAnswer], ...incorrectAnswers]);
   
    const optionBtns = document.querySelectorAll('.answers button');
    optionBtns.forEach((btn, i) => {
        btn.textContent = allAnswers[i].toString().replaceAll(',', ', ');
        document.querySelector('.answers').onclick = (e) => checkUserAnswer(e, correctAnswer, questions)
    }) 
}

function checkUserAnswer(e, correctAnswer, questions) {
    if (!e.target.matches('button')) return;

    const options = document.querySelectorAll('.option');
    const rightOption = Array.from(options).find(option => option.textContent.replaceAll(', ', ',') == correctAnswer);
   
    if (e.target.textContent.replaceAll(', ', ',') == correctAnswer) {
        
        correctScore++;
        updateScore(document.querySelector('.correct-score'), correctScore);
        e.target.classList.add('correct');
        
    } else {
        incorrectScore++;   
        updateScore(document.querySelector('.incorrect-score'), incorrectScore);
        e.target.classList.add('incorrect');
        rightOption.classList.add('correct'); 
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

function updateScore(element, score) {
    element.textContent = score;
}

function updateQuestionCount(index, questions) {
    document.querySelector('.question-count').textContent = `${index + 1}/${questions.length}`;
}

function finishQuiz(questions) {
    // display results
    toggleActive(document.querySelector('.results'));
    toggleActive(document.querySelector('.quiz'));
    document.querySelector('.result-message img').style.animation = 'rightAnswerAnimation .8s';
    const score = ((correctScore / questions.length) * 100).toFixed(0);
    document.querySelector('.score').textContent = `${score}%`;
    document.querySelector('.message').textContent = handleResultMessage(score);
}

function handleResultMessage(score) {
    if (score < 50) {
        return 'Don\'t give up!'; 
    } else if (score < 75) {
        return 'Keep going!';
    } else if (score < 90) {
        return 'You\'re crushing it!'; 
    } else if (score <= 100) {
        return 'You\'re a pro!';
    }
}

function restartGame() {

    toggleActive(document.querySelector('.results'));
    toggleActive(document.querySelector('.intro'));

    document.querySelector('.result-message img').style.animation = 'none';

    incorrectScore = 0;
    correctScore = 0;
    updateScore(document.querySelector('.correct-score'), correctScore);
    updateScore(document.querySelector('.incorrect-score'), incorrectScore);
    index = 0; 
}

document.querySelector('.play-again-btn').addEventListener('click', restartGame);

function getRandomElements(arr, n) {
    const shuffledArray = shuffleArray(arr);
    return shuffledArray.slice(0, n);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
                                 
async function getKanjiDetails(kanji) {
    const url = `https://kanjiapi.dev/v1/kanji/${kanji}`;
    const response = await fetch(url);
    const kanjiDetails = await response.json();
   
    return kanjiDetails;
}


// more info modal
document.getElementById('more-info-btn').addEventListener('click', () => {
    toggleActive(document.querySelector('.more-info-modal'));
})

document.querySelector('.close-modal').addEventListener('click', () => {
    toggleActive(document.querySelector('.more-info-modal'));

})

function toggleActive(element) {
    element.classList.toggle('active');
}