// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract abcExchange {
    mapping(address => bool) public allowed_tokens;
    IERC20Metadata public asset;
    address public vault;

    function buy(IERC20 token, uint amount) external;
    function sellFrom(IERC20 token, address recipient, uint amount) external;
}
