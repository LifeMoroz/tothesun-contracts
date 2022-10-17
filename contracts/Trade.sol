// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract Trade is Context {
    using SafeERC20 for IERC20;

    event Sold(
        address indexed recipient,
        IERC20 indexed acquire,
        uint256 amount
    );

    mapping(address => bool) public allowed_tokens;
    IERC20Metadata public asset;
    address public vault;

    constructor(IERC20Metadata _asset, address _vault) {
        asset = _asset;
        vault = _vault;
    }

    function buy(IERC20 spend, uint amount) external {
        require(allowed_tokens[spend], "TRADE::buy: token is not allowed");
        require(_msgSender() != vault, "TRADE::buy: caller can not be the vault");
        spend.safeTransferFrom(_msgSender(), vault, amount);
        asset.safeTransferFrom(address(this), _msgSender(), sunt_amount);
    }

    function sellFrom(IERC20 acquire, address recipient, uint amount) external {
        require(_msgSender() == vault, "TRADE::sellFrom: caller is not the vault");
        require(_msgSender() != recipient, "TRADE::sellFrom: recipient can not be the vault");
        asset.safeTransferFrom(recipient, address(this), amount);
        acquire.safeTransferFrom(vault, recipient, amount);
        emit Sold(recipient, acquire, amount);
    }

    function setVault(address _vault) external OnlyOwner {
        vault = _vault;
    }

    function allow(IERC20Metadata token) external OnlyOwner {
        require(
            token.decimals() == asset.decimals(),
            "TRADE::allow: decimals must be less or equal then asset.decimals()"
        );
        allowed_tokens[token] = true;
    }

    function disallow(address token) external OnlyOwner {
        allowed_tokens[token] = false;
    }
}
