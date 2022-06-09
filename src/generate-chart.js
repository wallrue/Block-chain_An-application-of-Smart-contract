var barCount = 60;
var initialDateStr = '01 Apr 2017 00:00 Z';
var countDate = 0; 

var ctx = document.getElementById('chart').getContext('2d');
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight/2;

var barData = getRandomData(initialDateStr, barCount);
function lineData() { return barData.map(d => { return { x: d.x, y: d.c} }) };

var chart = new Chart(ctx, {
	type: 'candlestick',
	data: {
		datasets: [{
			label: 'CHRT - Chart.js Corporation',
			data: barData
		}]
	}
});

var getRandomInt = function(max) {
	return Math.floor(Math.random() * Math.floor(max));
};

function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function randomBar(date, lastClose) {
	var open = +randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
	var close = +randomNumber(open * 0.95, open * 1.05).toFixed(2);
	var high = +randomNumber(Math.max(open, close), Math.max(open, close) * 1.1).toFixed(2);
	var low = +randomNumber(Math.min(open, close) * 0.9, Math.min(open, close)).toFixed(2);
	return {
		x: date.valueOf(),
		o: open,
		h: high,
		l: low,
		c: close
	};

}

function updateData(data, dateStr) {
	var date = luxon.DateTime.fromRFC2822(dateStr);
	date = date.plus({ days: countDate +1});
	countDate = countDate + 1;
	if (date.weekday <= 5) {
		data.shift();
		data.push(randomBar(date, data[data.length - 1].c));
	}

	return data;
}


function getRandomData(dateStr, count) {
	var date = luxon.DateTime.fromRFC2822(dateStr);
	var data = [randomBar(date, 30)]; //Random for 4 values of first candle from 30 as a center 
	while (data.length < count) { //Random for 4 values of candles from the latest value as a center 
		date = date.plus({ days: 1 });
		countDate = countDate + 1;
		if (date.weekday <= 5) {
			data.push(randomBar(date, data[data.length - 1].c));
		}
	}

	return data;
}

var update = function () {

	var dataset = chart.config.data.datasets[0];

	// candlestick vs ohlc
	var type = 'candlestick';
	dataset.type = type;

	// linear vs log
	var scaleType = 'linear';
	chart.config.options.scales.y.type = scaleType;

	// color
	dataset.color = {
		up: '#01ff01',
		down: '#fe0000',
		unchanged: '#999',
	};

	// border
	var defaultOpts = Chart.defaults.elements[type];
	dataset.borderColor = defaultOpts.borderColor;

	// mixed charts
	chart.config.data.datasets = [
		{
			label: 'CHRT - Chart.js Corporation',
			data: barData
		}	
	]

	chart.update();
};

setInterval(() => {
	// const NDAQ = stockData[0]['Trades'][i
	barData = updateData(barData, initialDateStr);
	update();
}, 2000);


/*ocument.getElementById('Buy').addEventListener('click', function () {
	var my_balance = 100;
	var my_lots = document.getElementById('lots').value;
	var my_msg = document.getElementById('error_msg');
	//Check min, max of lots
	if (my_lots * barData[barData.length - 1].c > my_balance) {
		my_msg.style.color = 'red';
		document.getElementById('error_msg').innerHTML = "Not enough money <br> (1 lot = " + barData[barData.length - 1].c + "ETH)";
	}
	else {
		my_msg.style.color = 'transparent';
	}
});

document.getElementById('Sell').addEventListener('click', function () {
	var my_balance = 100;
	var my_lots = document.getElementById('lots').value;
	var my_msg = document.getElementById('error_msg');
	//Check min, max of lots
	if (my_lots * barData[barData.length - 1].c > my_balance) {
		my_msg.style.color = 'red';
		document.getElementById('error_msg').innerHTML = "Not enough money <br> (1 lot = " + barData[barData.length - 1].c + "ETH)";
	}
	else {
		my_msg.style.color = 'transparent';
	}
});
*/