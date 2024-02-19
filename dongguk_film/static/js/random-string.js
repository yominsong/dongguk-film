//
// Global variables
//

const id_intro_message = document.getElementById("id_intro_message");
const id_welcome = document.getElementById("id_welcome");
const id_emoji = document.getElementById("id_emoji");
const id_emoticon = document.getElementById("id_emoticon");
const introMessage = new Array("오늘 촬영도 파이팅!", "오늘 편집도 파이팅!", "오늘 사전작업도 파이팅!", "오늘 후반작업도 파이팅!", "당신의 촬영을 응원해요!", "바빠도 밥은 먹고 찍어요!", "바빠도 잠은 자고 찍어요!", "안전촬영, 안전운전!");
const welcome = new Array("어서오세요!", "반가워요!", "어서와요!", "환영해요!", "기다렸어요!", "보고 싶었어요!");
const emoji = new Array("😀", "😁", "😃", "😄", "😆", "😉", "😊", "🙂", "🤗", "🤓");
const emoticon = new Array("o(>ω<)o", "o( ❛ᴗ❛ )o", "(๑˃ᴗ˂)ﻭ", "(´･ᴗ･ ` )", "(„• ֊ •„)", "(.❛ ᴗ ❛.)", "(≧◡≦)", "(o´∀`o)", "(*≧ω≦*)", "＼(≧▽≦)／", "ヽ(o＾▽＾o)ノ", "٩(◕‿◕｡)۶", "ヽ(・∀・)ﾉ", "(´｡• ω •｡`)", "ヽ(*・ω・)ﾉ", "(o´▽`o)", "(*´▽`*)", "(o˘◡˘o)");

//
// Main functions
//

function inputRandomItem() {
    if (id_intro_message !== null) id_intro_message.innerText = randomItem(introMessage);
    if (id_welcome !== null) id_welcome.innerText = randomItem(welcome);
    if (id_emoji !== null) id_emoji.innerText = randomItem(emoji);
    if (id_emoticon !== null) id_emoticon.innerText = randomItem(emoticon);
}

inputRandomItem();