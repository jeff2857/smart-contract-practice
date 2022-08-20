// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20 {
	/// @notice Returns the name of the token, optional
	/// @return name of the token
	function name() external view returns (string memory);

	/// @notice Returns the symbol of the token, optional
	/// @return symbol of the token
	function symbol() external view returns (string memory);

	/// @notice Returns the number of decimals the token uses, optional
	/// @return the number of decimals the token uses
	function decimal() external view returns (uint8);

	/// @notice Returns the total token supply
	/// @return the total token supply
	function totalSupply() external view returns (uint256);

	/// @notice Returns the account balance of another account with address `_owner`
	/// @param _owner address of the account
	/// @return balance
	function balanceOf(address _owner) external view returns (uint256 balance);

	/// @notice Transfers `_value` amount of tokens to address `_to`
	/// @param _to address to transfer to
	/// @param _value amount of token
	/// @return success whether the transfer is successful
	function transfer(address _to, uint256 _value) external returns (bool success);

	/// @notice Transfers `_value` amount of tokens from address `_from` to address `_to`
	/// @param _from address from
	/// @param _to address to
	/// @param _value amount of token
	/// @return success whether the transfer is successful
	function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);

	/// @notice Allows `_spender` to withdraw from your account multiple times, up to the `_value` amount.
	/// @notice If this function is called again it overwrites the current allowance with `_value`
	/// @param _spender spender address
	/// @param _value amount of token
	/// @return success whether the approving is successful
	function approve(address _spender, uint256 _value) external returns (bool success);

	/// @notice Returns the amount which `_spender` is still allowed to withdraw from `_owner`
	/// @param _owner owner address
	/// @param _spender spender address
	/// @return remaining amount of remaining token
	function allowance(address _owner, address _spender) external returns (uint256 remaining);

	/// @notice Transfer, MUST trigger when tokens are transfered, including zero value transfers
	/// @param _from address from
	/// @param _to address to
	/// @param _value amount of token transfered
	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	/// @notice Approval, MUST trigger on successful call to `approve(_spender, _value)`;
	/// @param _owner owner address
	/// @param _spender spender address
	/// @param _value amount of token approved
	event Approval(address indexed _owner, address _spender, uint256 _value);
}

contract ERC20 is IERC20 {
	mapping(address => uint256) private _balances;
	mapping(address => mapping(address => uint256)) private _allowances;

	uint256 private _totalSupply;

	string private _name;
	string private _symbol;

	constructor(string memory name_, string memory symbol_) {
		_name = name_;
		_symbol = symbol_;
	}

	function name() public view override returns (string memory) {
		return _name;
	}

	function symbol() public view override returns (string memory) {
		return _symbol;
	}

	function decimal() public pure override returns (uint8) {
		return 18;	
	}

	function totalSupply() public view override returns (uint256) {
		return _totalSupply;
	}

	function balanceOf(address _owner) public view override returns (uint256) {
		return _balances[_owner];
	}

	function transfer(address _to, uint256 _value) public override returns (bool success) {
		_transfer(msg.sender, _to, _value);
		return true;
	}

	function allowance(address _owner, address _spender) public override view returns (uint256) {
		return _allowances[_owner][_spender];
	}

	function approve(address _spender, uint256 _value) public override returns (bool success) {
		_approve(msg.sender, _spender, _value);
		return true;
	}

	function transferFrom(address _from, address _to, uint256 _value) public override returns (bool success) {
		address spender = msg.sender;
		_spendAllowance(_from, spender, _value);
		_transfer(_from, _to, _value);
		return true;
	}

	function _transfer(address from, address to, uint256 value) internal {
		require(from != address(0), "ERC20: transfer from the zero address");
		require(to != address(0), "ERC20: transfer to the zero address");

		uint256 fromBalance = _balances[from];
		require(fromBalance >= value, "ERC20: insufficient balance");

		_balances[from] = fromBalance - value;
		_balances[to] += value;

		emit Transfer(from, to, value);
	}

	function _approve(address owner, address spender, uint256 value) internal {
		require(owner != address(0), "ERC20: approve from the zero address");
		require(spender != address(0), "ERC20: approve to the zero address");

		_allowances[owner][spender] = value;

		emit Approval(owner, spender, value);
	}

	function _spendAllowance(address owner, address spender, uint256 value) internal {
		uint256 currentAllowance = _allowances[owner][spender];
		require(currentAllowance >= value, "ERC20: insufficient allowance");

		// update approval
		_approve(owner, spender, currentAllowance - value);
	}
}