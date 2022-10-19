// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract SUNT is ERC20 {
    constructor(address mint_to, uint amount) ERC20("Sun Token", "SUNT") {
        _mint(mint_to, amount);
    }
}