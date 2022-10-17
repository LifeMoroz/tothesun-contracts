// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface ISUNT is IERC20 {
    function buy(uint256 amount) external;
    function sell_to(address account, uint256 amount) external;
}
