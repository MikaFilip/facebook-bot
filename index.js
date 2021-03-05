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
	chat.say('Hi _ 002');
});





bot.hear(/weather (.*)/i, (payload, chat, data) => {
	console.log(data);
	const placeName = data.match[1];
	
	console.log(placeName);

	const askName = (convo) => {
		convo.ask(`Would you like know forecast for  tomerrow?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set("answer", text);
			convo.set('state', 2);
			console.log("answer is : " + text);
			if (text === 'yes') {
				console.log("yes for forecvast");
				convo.say("OK, find forecast");
			} else if (text === 'no') {

            }
			//convo.say(`Oh, your name is ${text}`).then(() => askSelfish(convo));
		});
	};


	const askSelfish = (convo) => {
		convo.ask(`Do you like me?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set("answer", text);
			convo.set('state', 2);
			console.log("answer is : " + text);
			if (text === 'yes') {
				console.log("yes for forecvast");
				convo.say("OK, find forecast")
			} else if (text === 'no') {

			}
			convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
		});
	};
	/*
		conversation.ask(`What's your name?`, (payload, conversation) => {
			const text = payload.message.text;
			conversation.set('name', text);
			conversation.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(conversation));
			conversation.end();
		});

	*/
	

	chat.conversation((conversation => {
		conversation.set("today", Date.now());
		conversation.set("placeName", placeName);
		conversation.set("_chat", chat);
		conversation.set("_payload", payload);
		conversation.set("_data", data);
		/*
		await fetch(WeatherApi + "&q=" + placeName).then(res => res.json()).then(json => {
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
			convo.set("placeName", placeName);
			convo.set("state", 1);
		})
		conversation.say("He here");
		askName(conversation);
		console.log("conversation ended");
		*/
		doFirst(conversation);
	}))
})


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