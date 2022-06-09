// SPDX-License-Identifier: MIT
//pragma solidity >=0.4.22 < 0.8.0;
pragma solidity ^0.8.0;

contract Election {

    uint public tradeBalance;

    // Model a Candidate
    struct Candidate {
        uint id;
        string my_time;
        uint my_lots;
        uint trade_type; //0: Buy; 1: Sell
        uint trade_open;
        uint trade_price;
        uint trade_profit;
        uint trade_state;
    }

    // Read/write candidates
    mapping(uint => Candidate) public candidates;

    // Store Candidates Count
    uint public candidatesCount;

    event addedEvent (
        uint indexed event_data
    );
    
    function addCandidate (string memory my_time, uint my_lots, uint trade_type, uint trade_open, uint trade_price, uint trade_profit) public {
        candidatesCount ++;
        //candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        candidates[candidatesCount] = Candidate(candidatesCount, my_time, my_lots, trade_type, trade_open, trade_price, trade_profit, 0);

        emit addedEvent(candidatesCount);
    }

    function vote (uint _candidateId, uint curent_val, uint current_profit, uint current_balance) public {
        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        candidates[_candidateId].trade_state = 1;

        // update profit 
        candidates[_candidateId].trade_price = curent_val;
        candidates[_candidateId].trade_profit = current_profit;
        tradeBalance = current_balance;

    	// trigger voted event
    	emit addedEvent(tradeBalance);
    }

    //----------


    //  Receiving Money to the Smart Contract
    receive() payable external{
        tradeBalance = tradeBalance + msg.value;
        emit addedEvent(tradeBalance);
    }

    
    //  Sending Money to the Another Adress
    function sendMoney(address payable _recipient, uint _amount) public {
        
        // Check the balance in the smart contract
        require(_amount <= tradeBalance, "Not enough balance");
         
        uint _amountwei = _amount * 1; 

        // Transfer the money
        _recipient.transfer(_amountwei);
        
        tradeBalance = tradeBalance - _amountwei; //Only having withdraw mode

        emit addedEvent(tradeBalance);
    }


}