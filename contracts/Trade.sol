// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Trade is Ownable {
    using SafeERC20 for ERC20;

    event Sold(
        address indexed recipient,
        ERC20 indexed acquire,
        uint256 amount
    );

    mapping(address => bool) public allowed_tokens;
    ERC20 public asset;
    address public vault;

    constructor(ERC20 _asset, address _vault) {
        asset = _asset;
        vault = _vault;
    }

    function buy(ERC20 spend, uint amount) external {
        require(allowed_tokens[address(spend)], "TRADE::buy: token is not allowed");
        require(_msgSender() != vault, "TRADE::buy: caller can not be the vault");
        spend.safeTransferFrom(_msgSender(), vault, amount);
        asset.safeTransfer(_msgSender(), amount);
    }

    function sellFrom(ERC20 acquire, address recipient, uint amount) external {
        require(allowed_tokens[address(acquire)], "TRADE::sellFrom: token is not allowed");
        require(_msgSender() == vault, "TRADE::sellFrom: caller is not the vault");
        require(_msgSender() != recipient, "TRADE::sellFrom: recipient can not be the vault");
        asset.safeTransferFrom(recipient, address(this), amount);
        acquire.safeTransferFrom(vault, recipient, amount);
        emit Sold(recipient, acquire, amount);
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    function allow(ERC20 token) external onlyOwner {
        require(
            token.decimals() == asset.decimals(),
            "TRADE::allow: decimals must be less or equal then asset.decimals()"
        );
        allowed_tokens[address(token)] = true;
    }

    function disallow(address token) external onlyOwner {
        allowed_tokens[token] = false;
    }
}
