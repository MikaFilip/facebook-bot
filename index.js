const BootBot = require('bootbot');
const config = require('config');
const nlp = require('natural');
const fetch = require('node-fetch');
var wndb = require('wordnet-db');

const tokenizer = new nlp.WordTokenizer();
const stemmer = nlp.PorterStemmer;
const wordnet = new nlp.WordNet();
var Lemmer = require('lemmer');
const WeatherApi = "http://api.openweathermap.org/data/2.5/weather?appid=febe9884711fbda5d8830f609b2edbbb&units=metric";
const ForecastApi = "http://api.openweathermap.org/data/2.5/forecast?appid=febe9884711fbda5d8830f609b2edbbb&units=metric";


var port = process.env.PORT || config.get('PORT');
const MOVIE_API = "http://www.omdbapi.com/?apikey=8df4f6a8";

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});



bot.hear(['hello', 'hi'], (payload, chat) => {
	console.log('The user said "hello" or "hi"!');
	chat.say("Hello, I'm a weather chat bot. Tell me the place for which you are interested in the weather.");
	chat.conversation((conversation => {
		conversation.set("today", Date.now());
		conversation.set("placeName", placeName);
		conversation.set("_chat", chat);
		conversation.set("_payload", payload);
		conversation.set("_data", data);
		
		doAskPlace(conversation);
	}));
});





bot.hear(/weather (.*)/i, (payload, chat, data) => {
	console.log(data);
	const placeName = data.match[1];
	
	
	

	chat.conversation((conversation => {
		conversation.set("today", Date.now());
		conversation.set("placeName", placeName);
		conversation.set("_chat", chat);
		conversation.set("_payload", payload);
		conversation.set("_data", data);
		
		doFirst(conversation);
	}))
})

async function doAskPlace(conv){
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	let result = await conv.ask(`Which weather on the place are you interested in?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set('state', 2);
			console.log("namePlace is : " + text);
			if (text.length > 0) {
				convo.set("namePlace", text);
			} else{
				doFinishConversation(conv);
            }
			//convo.say(`Oh, your name is ${text}`).then(() => askSelfish(convo));
		});
	console.log("==>  await finished");
}

async function doFirst(conv) {
	let chat = conv.get("_chat");
	let rsponse = 
		await fetch(WeatherApi + "&q=" + conv.get("placeName")).then(res => res.json()).then(json => {
			if (json["cod"] == 200) {
				if (json.hasOwnProperty('main')) {
					if (json['main'].hasOwnProperty('temp')) {
						chat.say("The tempeatrure is " + json['main']['temp']);
					}
				} else {
					
				}
			} else {  
				chat.say("I'm sorry I naven't read data.")
			}
			console.log("Search result is " + JSON.stringify(json));
			conv.set("state", 1);
		});
	let forecast = await doAskForForecast(conv);
	
}

async function doAskForForecast(conv){
	
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	let result = await conv.ask(`Would you like know forecast for  tomerrow?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set("answer", text);
			convo.set('state', 2);
			console.log("answer is : " + text);
			if (text === 'yes') {
				doFetchForecast(conv);
			} else if (text === 'no') {
				doFinishConversation(conv);
            }
			//convo.say(`Oh, your name is ${text}`).then(() => askSelfish(convo));
		});
	console.log("==>  await finished");
}

async function doFetchForecast(conv){
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	let rsponse = 
		await fetch(ForecastApi + "&q=" + conv.get("placeName")).then(res => res.json()).then(json => {
			if (json["cod"] == 200) {
				if (json.hasOwnProperty('main')) {
					if (json['main'].hasOwnProperty('temp')) {
						chat.say("The tempeatrure is " + json['main']['temp']);
					}
				} else {
					
				}
			} else {  
				chat.say("I'm sorry I naven't read data.")
			}
			console.log("Search result is " + JSON.stringify(json));
			conv.set("state", 1);
		});
}

async function doFinishConversation(conv){
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	chat.say("By have you nice time in "+conv.get("placeName"));
	conv.end();
}









bot.start(port);