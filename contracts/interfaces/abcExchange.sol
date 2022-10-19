// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract abcExchange {
    mapping(address => bool) public allowed_tokens;
    ERC20 public asset;
    address public vault;

    function buy(ERC20 token, uint amount) virtual external;
    function sellFrom(ERC20 token, address recipient, uint amount) virtual external;
}
