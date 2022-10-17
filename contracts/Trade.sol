// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract Trade is Context {
    using SafeERC20 for IERC20;

    mapping(address => bool) public allowed_tokens;
    IERC20Metadata public SUNT;
    address private vault;

    constructor(IERC20Metadata _SUNT, address _vault) {
        SUNT = _SUNT;
        vault = _vault;
    }

    function buy(IERC20 token, uint amount) external {
        require(allowed_tokens[token], "TRADE::buy: token is not allowed");
        require(_msgSender() != vault, "TRADE::buy: caller can not be the vault");
        token.safeTransferFrom(_msgSender(), vault, amount);
        SUNT.safeTransferFrom(address(this), _msgSender(), sunt_amount);
    }

    function sellFrom(IERC20 token, address recipient, uint amount) external {
        require(_msgSender() == vault, "TRADE::sellFrom: caller is not the vault");
        require(_msgSender() != recipient, "TRADE::sellFrom: recipient can not be the vault");
        SUNT.safeTransferFrom(recipient, address(this), amount);
        token.safeTransferFrom(vault, recipient, amount);
    }

    function setVault(address _vault) external OnlyOwner {
        vault = _vault;
    }

    function getVault() public view returns (address) {
        return vault;
    }

    function allow(IERC20Metadata token) external {
        require(
            token.decimals() == SUNT.decimals(),
            "TRADE::allow: decimals must be less or equal then SUNT.decimals()"
        );
        allowed_tokens[token] = true;
    }

    function disallow(address token) external {
        allowed_tokens[token] = false;
    }
}
