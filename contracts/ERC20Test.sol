// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ERC20.sol";

contract ERC20Test is ERC20 {
	constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_, symbol_) {
		_mint(msg.sender, initialSupply);
	}
}