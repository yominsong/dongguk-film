//
// Global constants and variables
//

const introMessage = new Array("오늘 촬영도 파이팅!", "오늘 편집도 파이팅!", "오늘 사전작업도 파이팅!", "오늘 후반작업도 파이팅!", "당신의 촬영을 응원해요!", "바빠도 밥은 먹고 찍어요!", "바빠도 잠은 자고 찍어요!", "안전촬영, 안전운전!");
const welcome = new Array("어서오세요!", "반가워요!", "어서와요!", "환영해요!", "기다렸어요!", "보고 싶었어요!");
const emoji = new Array("😀", "😁", "😃", "😄", "😆", "😉", "😊", "🙂", "🤗", "🤓");
const emoticon = new Array("o(>ω<)o", "o( ❛ᴗ❛ )o", "(๑˃ᴗ˂)ﻭ", "(´･ᴗ･ ` )", "(„• ֊ •„)", "(.❛ ᴗ ❛.)", "(≧◡≦)", "(o´∀`o)", "(*≧ω≦*)", "＼(≧▽≦)／", "ヽ(o＾▽＾o)ノ", "٩(◕‿◕｡)۶", "ヽ(・∀・)ﾉ", "(´｡• ω •｡`)", "ヽ(*・ω・)ﾉ", "(o´▽`o)", "(*´▽`*)", "(o˘◡˘o)");

//
// Sub functions
//

function randomItem(e) {
    return e[Math.floor(Math.random() * e.length)];
}

//
// Main functions
//

function inputRandomItem() {
    if (typeof id_intro_message !== "undefined") id_intro_message.innerText = randomItem(introMessage);
    if (typeof id_welcome !== "undefined") id_welcome.innerText = randomItem(welcome);
    if (typeof id_emoji !== "undefined") id_emoji.innerText = randomItem(emoji);
    if (typeof id_emoticon !== "undefined") id_emoticon.innerText = randomItem(emoticon);
}

inputRandomItem();