# overview

A kanji quiz built with [kanjiapi.dev](kanjiapi.dev). Made as upgrade of an old [project](https://tortaruga.github.io/n5-kanji-quiz/), which only supported N5 kanji and had a depressingly ugly user interface.

### built with

This project fetches the kanji lists and meanings from [kanjiapi.dev](kanjiapi.dev). I vaguely remember checking this api when I first started the old project, but as far as I remember it didn't have an endpoint for JLPT levels, only for grades, so I ended up writing the list myself (which is the reason why it only supported N5 — I like to suffer but not *that* much). 

The project is built with vanilla JS. I thought React's conditional rendering and states would have been useful, but in honor of my first version (which was made with vanilla js because I knew nothing else) I decided to use pure javascript again.

### notes on design

The biggest reason for this remake was that I wanted to include the project in my portfolio, but I needed to make it more attractive because although the functionality was there the interface was too hideous to be displayed proudly.

I am not a designer, but I tried my best with it, and I think we can at least agree it is an improvement from last time.

I focused on using the same colors from the illustrations to give the whole app a cohesive look, and I included some animations to make the experience more fun and dynamic. 

The answer buttons animations give a visual feedback for wrong and right answers, the level buttons animation provide a subtle but fun touch, and the loader bouncing dots add a bit of color and movement in case the user has to wait a while for the questions to be fetched. 

The design is responsive and the layout looks optimal across all screen sizes.

### accessibility

All buttons can be accessed through keyboard alone, so the game can be played with no mouse as well. 

All animations are removed in case the user prefers reduced motion.

All purely decorative images are hidden from assistive technologies and screen readers with alt="" and aria-hidden="true".

### error handling
Error messages get displayed to the user when it fails to fetch or there's no internet connection. If there are some network issues in between quiz questions, a message will alert the user, and when the connection gets restored the app will automatically resume loading the next question.