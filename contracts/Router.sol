// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ECDSASignature.sol";
import "./interfaces/abcExchange.sol";


contract Router is Ownable, SigVerify {
    using SafeERC20 for ERC20;

    event TokenBatchSend(
        address indexed sender,
        ERC20 indexed token,
        uint256 indexed send_type,
        address[] recipients,
        uint256[] values,
        uint256 amount
    );


    abcExchange exchange;
    mapping(address => uint256) public deduplication;

    constructor(abcExchange _exchange) {
        exchange = _exchange;
    }

    function routTokens(
        ERC20 token,
        uint256 send_type,
        address[] memory recipients,
        uint256[] memory values,
        uint256 amount,
        uint256 num,
        bytes memory sig
    ) external {
        require (recipients.length == values.length, "Router::routTokens: bad input arrays dimension");

        uint sum = 0;
        for (uint a = 0; a < values.length; a++)
          sum += values[a];

        require(sum == amount, "Router::routTokens: values sum != amount");
        require(isValidData(_msgSender(), address(token), send_type, recipients, values, amount, num, sig), "Router::routTokens: signature is invalid");
        require(num >= deduplication[_msgSender()], "Router::routTokens: deduplication fail");

        token.safeTransferFrom(_msgSender(), address(this), amount);

        for (uint i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(exchange.vault())) { // Swap investment and return resulting tokens to msg.sender
                token.approve(address(exchange), values[0]);
                exchange.buy(token, values[0]);
                exchange.asset().safeTransfer(_msgSender(), values[0]);
            } else {  // Referral program
                token.safeTransfer(recipients[i], values[i]);
            }
        }
        deduplication[_msgSender()] = num + 1;

        emit TokenBatchSend(
            _msgSender(),
            token,
            send_type,
            recipients,
            values,
            amount
        );
    }
}