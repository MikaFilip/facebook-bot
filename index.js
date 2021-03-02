const BootBot = require('bootbot');
const config = require('config');
const nlp = require('natural');
const fetch = require('node-fetch');
var wndb = require('wordnet-db');

const tokenizer = new nlp.WordTokenizer();
const stemmer = nlp.PorterStemmer;
const wordnet = new nlp.WordNet();
var Lemmer = require('lemmer');
const WeatherApi = "http://api.openweathermap.org/data/2.5/weather?appid=febe9884711fbda5d8830f609b2edbbb";


var port = process.env.PORT || config.get('PORT');
const MOVIE_API = "http://www.omdbapi.com/?apikey=8df4f6a8";

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});



bot.hear(['hello', 'hi'], (payload, chat) => {
	console.log('The user said "hello" or "hi"!');
	chat.say('Hi ');
});





bot.hear(/weather (.*)/i, (payload, chat, data) => {
		console.log(data);
		const movieName = data.match[1];
		console.log(movieName);

		const askName = (convo) => {
			convo.ask(`What's your name?`, (payload, convo) => {
				const text = payload.message.text;
				convo.set('name', text);
				console.log("name = " + text);
				convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
			});
		};

		conversation.ask(`What's your name?`, (payload, conversation) => {
			const text = payload.message.text;
			conversation.set('name', text);
			conversation.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(conversation));
			conversation.end();
		});


	chat.conversation((conversation => {
		

		fetch(WeatherApi + "&q=" + movieName).then(res => res.json()).then(json => {
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
		})
		askName(conversation);
		console.log("conversation ended");
	}))
})







bot.start(port);