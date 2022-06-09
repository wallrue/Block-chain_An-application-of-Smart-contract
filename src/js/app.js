
var ether_calib = 1000000000000000000;

App = {
    web3Provider: null,
    array: [],
    contracts: {},
    my_balance: 0,
    const_my_balance: 0,
    market_account: '0x0',
    trader_account: '0x0',

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);

        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Election.json", function (election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
            App.listenForEvents();
            return App.render();
        });
    },

    render: function () {
        var electionInstance;

        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.trader_account = account;
            }
        });

        // Load balance of trader in market
        App.balance();

        // Load contract data
        App.contracts.Election.deployed().then(function (instance) {

            electionInstance = instance;

            App.market_account = electionInstance.address;
            $("#accountAddress").html("Market Account: " + App.market_account + " _ Trader Account: " + App.trader_account);

            return electionInstance.candidatesCount();

        }).then(function (dealsCount) {
            var dataResults = $("#dataResults");
            dataResults.empty();

            for (var i = 1; i <= dealsCount; i++) {
                electionInstance.candidates(i).then(function (deal) {

                    var id     = deal[0];
                    var time   = deal[1];
                    var size   = deal[2];
                    var type   = (deal[3] == 0) ? "Buy" : "Sell";
                    var open   = deal[4] / ether_calib;
                    var price  = deal[5] / ether_calib;
                    var profit;
                    if (deal[3] == 0) {
                        profit = (deal[4] > deal[5]) ? - deal[6] / ether_calib : deal[6] / ether_calib;
                    } else {
                        profit = (deal[4] < deal[5]) ? - deal[6] / ether_calib : deal[6] / ether_calib;
                    }
                    profit = (profit).toFixed(3);

                    var resultTemplate;
                    // Render candidate Result
                    if (deal[7] == "0") {
                        resultTemplate = "<tr><td class=\"infor-td\" align=\"center\">" + time + "</td><td class=\"infor-td\" align=\"center\">" + size +
                            "</td><td class=\"infor-td\" align=\"center\">" + type +
                            "</td><td class=\"infor-td\" align=\"center\">" + open +
                            "</td><td id=\"price_" + id + "\" class=\"infor-td\" align=\"center\">" + price +
                            "</td><td id=\"profit_" + id + "\" class=\"infor-td\" align=\"center\">" + profit +
                            "<td><button id=\"" + id + "\" class=\"btn-close\" style=\"height:100%;width:100%\" onclick=\"App.endVote(this.id); return false;\">Close Deal</button></td>";
                    }
                    else {
                        resultTemplate = "<tr><td class=\"infor-td\" align=\"center\">" + time + "</td><td class=\"infor-td\" align=\"center\">" + size +
                            "</td><td class=\"infor-td\" align=\"center\">" + type +
                            "</td><td class=\"infor-td\" align=\"center\">" + open +
                            "</td><td id=\"price_" + id + "\" class=\"infor-td\" align=\"center\">" + price +
                            "</td><td id=\"profit_" + id + "\" class=\"infor-td\" align=\"center\">" + profit +
                            "</td><td class=\"infor-td\" align=\"center\" style=\"background-color:#b4b8b6\">Closed</td></tr>";
                    }
                    dataResults.append(resultTemplate);

                });
            }

        }).catch(function (error) {
            $("#accountAddress").html(error);
        });
    },


    castVote: function () {
        $("#accountAddress").html("Processsing..");
        var tradeDate = luxon.DateTime.fromRFC2822(initialDateStr);
        tradeDate = tradeDate.plus({ days: countDate + 1 }).toFormat('MMMM dd, yyyy');

        var tradeType_tmp = $('#trade-type').val();
        var tradeType;
        if (tradeType_tmp == "buy") tradeType = 0;
        else if (tradeType_tmp == "sell") tradeType = 1;

        var lots = $('#lots').val();
        var num_bar = barData.length;
        var openVal = barData[num_bar - 1].c * ether_calib; 

        //Save data in a local storage
        App.array.push({
            my_time: tradeDate.toString(), my_lots: lots, trade_type: tradeType, 
            trade_open: openVal, trade_price: 0, trade_profit: 0, trade_state: "0"
        });

        //Save data in smart contract
        App.contracts.Election.deployed().then(function (instance) {
            return instance.addCandidate(App.array[App.array.length - 1].my_time, App.array[App.array.length - 1].my_lots, App.array[App.array.length - 1].trade_type,
                App.array[App.array.length - 1].trade_open, App.array[App.array.length - 1].trade_price, App.array[App.array.length - 1].trade_profit, { from: App.trader_account }); //msg.sender (from: App.market_account) means nothing
        }).catch(function (err) {
            $("#accountAddress").html(error);
        });
    },

    endVote: function (cId) {
        var candidateId = parseInt(cId);
        var current_val = barData[barData.length - 1].c * ether_calib;
        var weight_ = App.array[candidateId-1].my_lots;
        var current_profit;

        if (App.array[candidateId-1].trade_type == 0) {
            current_profit = (current_val - App.array[candidateId - 1].trade_open) * weight_ / 100;
        }
        else {
            current_profit = (App.array[candidateId - 1].trade_open - current_val) * weight_ / 100;
        }

        App.array[candidateId - 1].trade_state = "1";
        App.array[candidateId - 1].trade_price = current_val;
        App.array[candidateId - 1].trade_profit = current_profit;

        App.my_balance = parseInt(App.my_balance);
        if (App.my_balance + current_profit < 0) {
            App.my_balance = 0;
        }
        else {
            App.my_balance = App.my_balance + current_profit; //If the balance is a little negative, it will be rounded to zero
        }

        App.contracts.Election.deployed().then(function (instance) { //Smart contract can not store the negative value so we need to get abs of current_profit
            return instance.vote(candidateId, current_val, Math.abs(current_profit), App.my_balance, { from: App.trader_account }); //{ from: App.market_account, value});
        }).then(function (tradeBalance) {
            var msg = "<b>Income: </b>" + (tradeBalance / ether_calib).toFixed(3) + " ETH";
            $("#incoming").html(msg);
        }).catch(function (err) {
            $("#accountAddress").html(error);
        });
    },

/*    endVote_all: function () { //amount of lose is stored in .sol file
        if (App.array.length > 0) {
            for (var j = 0; j < App.array.length; j++) {
                if (App.array[j].trade_state == "0") {
                    var table_id = j + 1;
                    App.endVote(table_id);
                }
            }
        }
    },*/

    withdraw: function () { //amount of lose is stored in .sol file

        var amoumt = parseInt($('#withdraw_amount').val() * ether_calib);

        App.contracts.Election.deployed().then(function (instance) {
            return instance.sendMoney(App.trader_account, amoumt, { from: App.trader_account }); //0.01 * ether_calib = transfer fee
        }).catch (function (err) {
            $("#accountAddress").html(error);
        });
    },

    balance: function () { //Get balance from market
        App.contracts.Election.deployed().then(function (instance) {
            return instance.tradeBalance(); //format {from: msg.sender, msg.value}
        }).then(function (tradeBalance) {
            App.my_balance = tradeBalance;
            var msg = "<b>Income: </b>" + (App.my_balance / ether_calib).toFixed(3) + " ETH";
            $("#incoming").html(msg);
        }).catch(function (err) {
            $("#accountAddress").html(error);
        });
    },

    listenForEvents: function () {
        App.contracts.Election.deployed().then(function (instance) {
            instance.addedEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                console.log("This is the event: ", event);
                // Reload when a new vote is recorded
                App.render();
            });
        });
    }

};

$(function () {

    $(window).load(function () {
        App.init();
    });
});



setInterval(() => { //Update table and check if loss was higher than balance

    var sum_profit = 0;

    if (App.array.length > 0) {

        var cur_val = barData[barData.length - 1].c;
        for (var i = 0; i < App.array.length; i++) {
            if (App.array[i].trade_state == "0") {

                var table_id = i + 1;
                var pri_id = "price_" + table_id;
                var pro_id = "profit_" + table_id;

                var weight = App.array[i].my_lots;
                document.getElementById(pri_id).innerHTML = cur_val;
                if (App.array[i].trade_type == 0) {
                    cur_profit = ((cur_val * ether_calib - App.array[i].trade_open) * weight / ether_calib / 100).toFixed(3);
                }
                else {
                    cur_profit = ((App.array[i].trade_open - cur_val * ether_calib) * weight / ether_calib / 100).toFixed(3);
                }
                document.getElementById(pro_id).innerHTML = cur_profit;

                sum_profit += cur_profit; 
            }
        }

        //$("#accountAddress").html(sum_profit * ether_calib + parseInt(App.my_balance));

        //if ((parseInt(sum_profit) * ether_calib + parseInt(App.my_balance) < 0) && !isNaN(parseInt(App.my_balance))) {
        //    App.endVote_all();
        //} 
    }

}, 2000);
