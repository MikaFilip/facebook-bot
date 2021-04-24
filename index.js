'use strict';
const BootBot = require('bootbot');
const config = require('config');
const fetch = require('node-fetch');
const echoModule = require('./modules/echo');

const WeatherApi = "http://api.openweathermap.org/data/2.5/weather?appid=febe9884711fbda5d8830f609b2edbbb&units=metric";
const ForecastApi = "http://api.openweathermap.org/data/2.5/forecast?appid=febe9884711fbda5d8830f609b2edbbb&units=metric";


var port = process.env.PORT || config.get('PORT');

var userId;


const bot = new BootBot({
  accessToken: config.get('ACCESS_TOKEN'),
  verifyToken: config.get('VERIFY_TOKEN'),
  appSecret: config.get('APP_SECRET')
});

bot.setGreetingText("Hey there! I am weather chat bot");

bot.module(echoModule);

const askPlace = (convo) => {
	
}



const askWeather = async (convo) => {
  convo.ask(`Where are you interested in the weather?`, (payload, convo, data) => {
    const place = payload.message.text;
	convo.set("place", place);
    fetch(WeatherApi+"&q="+place).then(res => res.json()).then(json => {
		//get weather
		console.log("Weather = "+JSON.stringify(json));
		convo.set("weather", json);
		if (json.hasOwnProperty('cod')) {
			let cod = json['cod'];
			if (cod == 200) {
				
				convo.ask((convo) => {
					const buttons = [
						{ type: 'postback', title: 'Show forecast', payload: 'SHOW_FORECAST' },
						//{ type: 'postback', title: 'Compare with.', payload: 'ENTER_AGAIN' },
						{ type: 'postback', title: 'Compare with.', payload: 'ENTER_COMPARE' },
						{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
					];
					convo.sendButtonTemplate(getWeather(convo) + "\n\nWhat do you want to do?", buttons);
				}, (payload, convo, data) => {},
					[
					{
					  event: 'postback:SHOW_FORECAST',
					  callback: (payload, convo) => {
						convo.say('We are showing you forecast.').then(() => showForecast(convo));
					  }
					},
					{
					  event: 'postback:ENTER_AGAIN',
					  callback: (payload, convo) => {
						convo.say('We are chenging place.').then(() => askWeather(convo));
					  }
					},
					{
						event: 'postback:ENTER_COMPARE',
						callback: (payload, convo) => {
						  convo.say('We are comapring').then(() => askCompare(convo));
						}
					  },
					{
					  event: 'postback:END_CONVERSATION',
					  callback: (payload, convo) => {
						convo.say('Our conversation is finished, bye').then(() => convo.end());
					  }
					}
					]
				);
				
			}
			else{
				//unknown place
				let chat = convo.get("_chat");
				let payload = convo.get("_payload");
				convo.ask((convo) => {
					const buttons = [
						{ type: 'postback', title: 'Enter place again', payload: 'ENTER_AGAIN' },
						{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
					];
					convo.sendButtonTemplate("Sorry, I don't know \""+convo.get("place")+"\"\nWhat do you want to do?", buttons);
				}, (payload, convo, data) => {
					const text = payload.message.text;
					convo.set('gender', text);
					convo.say(`Great, you are a ${text}`).then(() => askAge(convo));
				}, [
					{
					  event: 'postback:ENTER_AGAIN',
					  callback: (payload, convo) => {
						convo.say('You clicked on a button').then(() => askWeather(convo));
					  }
					},
					{
					  event: 'postback:END_CONVERSATION',
					  callback: (payload, convo) => {
						convo.say('Our conversation is finished, bye').then(() => convo.end());
					  }
					}
				  ]);
			}
		} else {
			chat.say("Sorry, I have received wrong data.");
		}
		
	});/*.catch( error => {
		let chat = convo.get("_chat");
		chat.say("Sorry, I don't know \""+convo.get("place")+"\"");
		
	});*/
  });
};

const showForecast = async (convo) =>{
	console.log("hre will be forecat code day = "+convo.get("day"))
	if (convo.get("forecast") === undefined){
		let json = await getJson(ForecastApi + "&q=" + convo.get("place"));
		console.log("json = "+JSON.stringify(json));
		if(json.cod == 200){
			convo.set("forecast", convertForecast(json));
			convo.set("day", "1");
		}
	}
	let fcst = convo.get("forecast")["forecast"];
	let day = convo.get("day").toString();
	if(typeof day === "undefined" || day == null){
		day = "1";
	}
	
	let nextDay = (parseInt(day)+1).toString();
	let prevDay = (parseInt(day)-1).toString();
	console.log(JSON.stringify(fcst));
	console.log("next day = ",nextDay);
	console.log("prev day = ",prevDay);
	if(fcst.hasOwnProperty(day)){
		console.log(JSON.stringify(fcst[day]));
		let buttons;
		if(fcst.hasOwnProperty(prevDay) && fcst.hasOwnProperty(nextDay)){
			buttons = [
				{ type: 'postback', title: 'Prev day', payload: 'SHOW_FORECAST_FOR_PREV_DAY' },
				{ type: 'postback', title: 'Next day', payload: 'SHOW_FORECAST_FOR_NEXT_DAY' },
				{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' }
			];
		} else if(fcst.hasOwnProperty(prevDay)){
			buttons = [
				{ type: 'postback', title: 'Prev day', payload: 'SHOW_FORECAST_FOR_PREV_DAY' },
				{ type: 'postback', title: 'Change place.', payload: 'ENTER_AGAIN' },
				{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
			];
		} else if(fcst.hasOwnProperty(nextDay)){
			buttons = [
				{ type: 'postback', title: 'Next day', payload: 'SHOW_FORECAST_FOR_NEXT_DAY' },
				{ type: 'postback', title: 'Change place.', payload: 'ENTER_AGAIN' },
				{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
			];

		} else {
			buttons = [
				{ type: 'postback', title: 'Change place.', payload: 'ENTER_AGAIN' },
				{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
			];
		}
		convo.say("The wether int \""+convo.get("place")+"\" on "+fcst[day]["date"] + " will be max temperature = " 
				+  fcst[day]["max"] + " and mini temperature = " + fcst[day]["min"] ).then(() => {
					convo.ask((convo) => {
						convo.sendButtonTemplate(getWeather(convo) + "\n\nWhat do you want to do?", buttons);
					}, (payload, convo, data) => {},
						[
						{
						  event: 'postback:SHOW_FORECAST_FOR_NEXT_DAY',
						  callback: (payload, convo) => {
							convo.set("day", nextDay);
							convo.say('We are showing you forecast.').then(() => {
								console.log("st day on " + convo.get("day"))
								showForecast(convo)
							});
						  }
						},{
							event: 'postback:SHOW_FORECAST_FOR_PREV_DAY',
							callback: (payload, convo) => {
							  convo.set("day", prevDay);
							  convo.say('We are showing you forecast.').then(() => {
								  console.log("st day on " + convo.get("day"))
								  showForecast(convo)
							  });
							}
						  },
						{
						  event: 'postback:ENTER_AGAIN',
						  callback: (payload, convo) => {
							convo.say('We are chenging place.').then(() => askWeather(convo));
						  }
						},
						{
						  event: 'postback:END_CONVERSATION',
						  callback: (payload, convo) => {
							convo.say('Our conversation is finished, bye').then(() => convo.end());
						  }
						}
						]
					);
				});
	}
	
};

const askCompare = async (convo) => {
	console.log("We will ask for compare")
	convo.ask("Which place would you want to comare with \""+convo.get("place")+"\"?", (payload, convo, data) => {
		const compare = payload.message.text;
		convo.set("compare", compare);
		fetch(WeatherApi+"&q="+compare).then(res => res.json()).then(json => {
			if (json.hasOwnProperty('cod')) {
				let cod = json['cod'];
				if (cod == 200) {
					let weather = convo.get("weather");
					let message = '';
					if (json.hasOwnProperty('main') && weather.hasOwnProperty('main')) {
						if (json['main'].hasOwnProperty('temp') && weather['main'].hasOwnProperty('temp')) {
							let tmp1 = json['main']['temp'];
							let tmp2 = weather['main']['temp'];
							if(tmp1 > tmp2){
								message = "In \""+compare+"\" is better temerature as \""+convo.get("place")+"\". \n"+ tmp1 + " > "+tmp2;
							}
							else if(tmp1 < tmp2){
								message = "In \""+convo.get("place")+" is better temerature as \""+compare+"\". \n"+ tmp2 + " > "+tmp1;
							}
							else{
								message = "Weather is same on both places \""+convo.get("place")+"\" and \""+compare+"\". \n"+ tmp2 + " = "+tmp1;
							}
						}
					}
					convo.ask((convo) => {
						const buttons = [
							{ type: 'postback', title: 'Show forecast', payload: 'SHOW_FORECAST' },
							//{ type: 'postback', title: 'Compare with.', payload: 'ENTER_AGAIN' },
							{ type: 'postback', title: 'Compare with.', payload: 'ENTER_COMPARE' },
							{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
						];
						convo.sendButtonTemplate(message + "\n\nWhat do you want to do?", buttons);
					}, (payload, convo, data) => {},
						[
						{
						  event: 'postback:SHOW_FORECAST',
						  callback: (payload, convo) => {
							convo.say('We are showing you forecast.').then(() => showForecast(convo));
						  }
						},
						{
						  event: 'postback:ENTER_AGAIN',
						  callback: (payload, convo) => {
							convo.say('We are chenging place.').then(() => askWeather(convo));
						  }
						},
						{
							event: 'postback:ENTER_COMPARE',
							callback: (payload, convo) => {
							  convo.say('We are chenging place.').then(() => ackCompare(convo));
							}
						  },
						{
						  event: 'postback:END_CONVERSATION',
						  callback: (payload, convo) => {
							convo.say('Our conversation is finished, bye').then(() => convo.end());
						  }
						}
						]
					);
					
				}
				else{
					//unknown place
					let chat = convo.get("_chat");
					let payload = convo.get("_payload");
					convo.ask((convo) => {
						const buttons = [
							{ type: 'postback', title: 'Enter place again', payload: 'ENTER_AGAIN' },
							{ type: 'postback', title: 'End the conversation', payload: 'END_CONVERSATION' },
						];
						convo.sendButtonTemplate("Sorry, I don't know \""+convo.get("place")+"\"\nWhat do you want to do?", buttons);
					}, (payload, convo, data) => {
						const text = payload.message.text;
						convo.set('gender', text);
						convo.say(`Great, you are a ${text}`).then(() => askAge(convo));
					}, [
						{
						  event: 'postback:ENTER_AGAIN',
						  callback: (payload, convo) => {
							convo.say('You clicked on a button').then(() => askWeather(convo));
						  }
						},
						{
						  event: 'postback:END_CONVERSATION',
						  callback: (payload, convo) => {
							convo.say('Our conversation is finished, bye').then(() => convo.end());
						  }
						}
					  ]);
				}
			} else {
				chat.say("Sorry, I have received wrong data.");
			}
		});
	});
};





const askAge = (convo) => {
  convo.ask(`Final question. How old are you?`, (payload, convo, data) => {
    const text = payload.message.text;
    convo.set('age', text);
    convo.say(`That's great!`).then(() => {
      convo.say(`Ok, here's what you told me about you:
      - Name: ${convo.get('name')}
      - Favorite Food: ${convo.get('food')}
      - Gender: ${convo.get('gender')}
      - Age: ${convo.get('age')}
      `);
      convo.end();
    });
  });
};

bot.hear(['hello', 'hi', /hey( there)?/i], (payload, chat) => {
	chat.conversation((convo) => {
		console.log("start ask weather");
		convo.set("today", Date.now());
		convo.set("_chat", chat);
		convo.set("_payload", payload);
		askWeather(convo);
		console.log("end conv");
	});
});



const getWeather = (conv) =>{
	let json = conv.get("weather");
	if (json.hasOwnProperty('main')) {
		if (json['main'].hasOwnProperty('temp')) {
			return("The tempeatrure is " + json['main']['temp']);
		}
	} else {
		return "error";
	}
}




const getJson = async (uri) =>{
  const response = await fetch(uri);
  const json = await response.json();
  return json;
}


async function fetchMoviesJSON() {
	const response = await fetch('/movies');
	const movies = await response.json();
	return movies;
  }


const convertForecast = (json) =>{
	console.log("new date = "+ (new Date()));
	let now = convertDate(new Date());
	console.log("  => now is : "+now);
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
			if(days > 0){
				if(!obj['forecast'].hasOwnProperty(days)){
					obj['forecast'][days] = {};
					obj['forecast'][days]['date'] = dateToIso(date);
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
	}
	return obj;
}

const convertDate = (value) =>{
	let d = new Date(value);
	console.log("date begin = "+d+" param = "+value);
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	console.log("data on end = "+d);
	return d;
}

const dateToIso = (value) => {
	let reg = /(\d\d\d\d-\d\d-\d\d)(.*)/;
	let arr = reg.exec(value.toISOString());
	return arr[1];
}

const countDaysBetweenDates = (startDate, endDate) => {
  const start = new Date(dateToIso(startDate)); //clone
  const end = new Date(dateToIso(endDate)); //clone
  let dayCount = 0

  while (end > start) {
    dayCount++
    start.setDate(start.getDate() + 1)
  }
  return dayCount
}



bot.start(port);