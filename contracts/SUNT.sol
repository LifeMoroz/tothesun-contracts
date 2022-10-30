// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract SUNT is ERC20, Ownable {
    address public trader;

    constructor() ERC20("Sun Token", "SUNT") {}

    function mint(address _to, uint amount) external onlyTrader {
        _mint(_to, amount);
    }

    function burn(address _from, uint amount) external onlyTrader {
        _burn(_from, amount);
    }

    function setTrader(address _trader) external onlyOwner {
        trader = _trader;
    }

    modifier onlyTrader() {
        require(_msgSender() == trader, "TRADE::onlyTrader: caller is not the trader");
        _;
    }
}