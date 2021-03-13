const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch');


const WeatherApi = "http://api.openweathermap.org/data/2.5/weather?appid=febe9884711fbda5d8830f609b2edbbb&units=metric";
const ForecastApi = "http://api.openweathermap.org/data/2.5/forecast?appid=febe9884711fbda5d8830f609b2edbbb&units=metric";


var port = process.env.PORT || config.get('PORT');

const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});



bot.hear(['hello', 'hi'], (payload, chat) => {
	console.log('The user said "hello" or "hi"!');
	//chat.say("Hello, I'm a weather chat bot. Tell me the place for which you are interested in the weather.");
	chat.conversation((conversation => {
		conversation.set("today", Date.now());
		conversation.set("_chat", chat);
		conversation.set("_payload", payload);
		
		doInvite(conversation);
	}));
	console.log("finished");
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







bot.hear('ask me', (payload, chat) => {

	const askName = (convo) => {
		console.log("  > => askName");
		convo.ask(`What's your name?`, (payload, convo) => {
			const text = payload.message.text;
			let result = null;
			(async function () {
				// wait to http request to finish
				let data  = await  getJson(WeatherApi + "&q=Prague");
				console.log("Json = "+JSON.stringify(data));
				// below code will be executed after http request is finished
				// some code
			})();
			console.log("result = "+ JSON.stringify(result));
			convo.set('name', text);
			convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
		});
		
		console.log("  / => askName");
	};

	const askFavoriteFood = (convo) => {
		console.log("  > => askFood");
		convo.ask(`What's your favorite food?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set('food', text);
			convo.say(`Got it, your favorite food is ${text}`).then(() => sendSummary(convo));
		});
		console.log("  / => askFood");
	};

	const sendSummary = (convo) => {
		
		console.log("  > => summa");
		convo.say(`Ok, here's what you told me about you:
	      - Name: ${convo.get('name')}
	      - Favorite Food: ${convo.get('food')}`);
		
		console.log("  / => summa");
      convo.end();
	};

	chat.conversation((convo) => {
		console.log("start conv");
		askName(convo);
		console.log("end conv");
	});
});

bot.hear(/(.*)/i, (payload, chat, data) => {
	console.log("I heard test");
	chat.conversation((conversation => {
		conversation.set("_today", Date.now());
		conversation.set("_chat", chat);
		conversation.set("_payload", payload);
		conversation.set("_data", data);
		
		addAll(conversation);
	}))
})



async function addAll(conv) {
  let result = "";
  let answer = "";
  let weather;
  let loop = true;
  let finish;
  result = await say(conv, "Hi, I'm a weather chat bot. Everytime you can say 'finish' for finising our conversation.");
  console.log(result);
  console.log(result);
  do{
	  answer = await ask(conv, "Which the place for the weather are you interested in?");
	  console.log("answer = "+answer);
	  weather = await getJson(WeatherApi+"&q="+answer);
	  conv.set("placeName", answer);
	  conv.set("weather", weather);
	  if(answer === 'finish'){
		  finish(conv);
		  end;
		  break;
	  }
	  if(weather.cod == 200){
		  sayWeather(conv);
		  await askForForecast(conv);
		  loop = false;
	  } else if(weather.cod = 404){
		  say(conv, "Sorry, I don't know place \""+answer+"\".");
	  } else {
		  say(conv, "error = "+weather.cod);
	  }
  } while(loop);
  
  finish = await ask(conv, "Would you like finish our conversation?");
  if(finish === "yes"){
	  finish(conv);
  }
  else{
	eraseConv();
	await addAll(conv);
  }
  
}

async function askForForecast(conv){
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	let answer;
	let said = true;
	answer = await ask(conv, "Would you know how weather will be?");
	if(answer === "yes"){
		let json = await getJson(ForecastApi + "&q=" + conv.get("placeName"));
		if(json.cod == 200){
			conv.set("forecast", convertForecast(json));
			conv.set("days", 1);
			sayForecast(conv);
			do{
				answer = await ask(conv, "Would you like know weather for next day?");
				if(answer === "yes"){
					conv.set("days", conv.get("days") + 1);
					said = sayForecast(conv);
				}
				else{
					said = false;
				}
			}while(said);
		}
	}
}


async function say(conv, message){
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	return new Promise((resolve, reject) => {
		console.log(" + --> say");
		chat.say(message);
		resolve(message);
	});
}

const eraseConv = (conv) => {
	let regex = /\_(.*)/g;
	for (const [key, value] of Object.entries(conv.context)) {
		if(!key.match(regex)){
			delete conv.context[key];
		}
	}
}




async function getJson(uri){
	return new Promise((resolve, reject) => {
    fetch(uri).then(res => res.json()).then(json => {
		resolve(json);
	}).catch( error => {
		let ret = {};
		ret["cod"] = 900;
		ret["error"] = error;
		resolve(data);
	});
  });
}

async function ask(conv, question){
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	return new Promise((resolve, reject) => {
		conv.ask(question, (payload, convo) => {
			resolve(payload.message.text);
		});
	});
	
}


const finish = (conv) => {
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	chat.say("By have you nice time in "+conv.get("placeName"));
	conv.end();
}


const sayForecast = (convo) => {
	let chat = convo.get("_chat");
	let payload = convo.get("_payload");
	if(typeof convo.get("forecast") === "undefined" || convo.get("forecast") == null){
		//error
		console.log("     -- error forecast is not known");
	} else {
		let days = convo.get("days").toString();
		if(typeof days === "undefined" || days == null){
			days = "1";
		}
		let fcst = convo.get("forecast")["forecast"];
		if(fcst.hasOwnProperty(days)){
			console.log(JSON.stringify(fcst[days]));
		}
		if(typeof fcst[days] === "undefined" || fcst[days] == null) {
			chat.say("Sorry, I don't have forecast for that day");
			return false;
		} else {
			
			chat.say("The wether on "+fcst[days]["date"].toISOString() + " will be max temperature = " 
				+  fcst[days]["max"] + " and mini temperature = " + fcst[days]["min"] );
			convo.set("days", days + 1);
		}
		
	}
	return true;
}


const sayWeather = (conv) =>{
	let chat = conv.get("_chat");
	let payload = conv.get("_payload");
	let json = conv.get("weather");
	if (json.hasOwnProperty('main')) {
		if (json['main'].hasOwnProperty('temp')) {
			chat.say("The tempeatrure is " + json['main']['temp']);
		}
	} else {
		
	}
}

const convertDate = (value) =>{
	let d = new Date(value);
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}

const countDaysBetweenDates = (startDate, endDate) => {
  const start = new Date(startDate) //clone
  const end = new Date(endDate) //clone
  let dayCount = 0

  while (end > start) {
    dayCount++
    start.setDate(start.getDate() + 1)
  }

  return dayCount
}



const convertForecast = (json) =>{
	let now = convertDate(new Date());
	let obj = {};
	obj['today'] = now;
	obj['forecast'] = {};
	if(json.hasOwnProperty("list")){
		for(let i = 0; i < json["list"].length; i++){
			let obj1 = json["list"][i];
			let date = null;
			let min = Number.MAX_VALUE;
			let max = Number.MIN_VALUE;
			let days = -1;
			for (const [key, value] of Object.entries(obj1)) {
				if(key.match(/dt/g)){
					date = convertDate(value);
				}
				if(key.match(/main/g)){
					min = value["temp_min"];
					max = value["temp_max"];
				}
				
			}
			days = countDaysBetweenDates(now, date);
			if(!obj['forecast'].hasOwnProperty(days)){
				obj['forecast'][days] = {};
				obj['forecast'][days]['date'] = date;
				obj['forecast'][days]['days'] = days;
				obj['forecast'][days]['min'] = min;
				obj['forecast'][days]['max'] = max;
			}
			else{
				if(obj['forecast'][days]['min'] > min){
					obj['forecast'][days]['min'] = min;
				}
				if(obj['forecast'][days]['max'] < max){
					obj['forecast'][days]['max'] = max;
				}
			}
		}
	}
	return obj;
}


bot.start(port);