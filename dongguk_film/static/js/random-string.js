var introMessage = new Array("오늘 촬영도 파이팅!", "오늘 편집도 파이팅!", "오늘 사전작업도 파이팅!", "오늘 후반작업도 파이팅!", "당신의 촬영을 응원해요!", "바빠도 밥은 먹고 찍어요!", "바빠도 잠은 자고 찍어요!", "안전촬영, 안전운전!");
var welcome = new Array("어서오세요!", "반가워요!", "어서와요!", "환영해요!", "기다렸어요!", "보고 싶었어요!");
var emoji = new Array("😀", "😁", "😃", "😄", "😆", "😉", "😊", "🙂", "🤗", "🤓");
var emoticon = new Array("o(>ω<)o", "o( ❛ᴗ❛ )o", "(๑˃ᴗ˂)ﻭ", "(´･ᴗ･ ` )", "(„• ֊ •„)", "(.❛ ᴗ ❛.)", "(≧◡≦)", "(o´∀`o)", "(*≧ω≦*)", "＼(≧▽≦)／", "ヽ(o＾▽＾o)ノ", "٩(◕‿◕｡)۶", "ヽ(・∀・)ﾉ", "(´｡• ω •｡`)", "ヽ(*・ω・)ﾉ", "(o´▽`o)", "(*´▽`*)", "(o˘◡˘o)");
function randomItem(e) {
    return e[Math.floor(Math.random() * e.length)];
}
if (document.querySelector("#introMessage")) {
    document.querySelector("#introMessage").innerText = randomItem(introMessage);
};
if (document.querySelector("#welcome")) {
    document.querySelector("#welcome").innerText = randomItem(welcome);
};
if (document.querySelector("#emoji")) {
    document.querySelector("#emoji").innerText = randomItem(emoji);
};
if (document.querySelector("#emoticon")) {
    document.querySelector("#emoticon").innerText = randomItem(emoticon);
};