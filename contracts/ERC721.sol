// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { IERC165, ERC165 } from "./ERC165.sol";

interface IERC721 is IERC165 {
	event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

	event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

	event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

	function balanceOf(address _owner) external view returns (uint256);

	function ownerOf(uint256 _tokenId) external view returns (address);

	function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata data) external payable;

	function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;

	function transferFrom(address _from, address _to, uint256 _tokenId) external payable;

	function approve(address _approved, uint256 _tokenId) external payable;

	function setApprovalForAll(address _operator, bool _approved) external;

	function getApproved(uint256 _tokenId) external view returns (address);

	function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}

interface IERC721Metadata {
	function name() external view returns (string memory);

	function symbol() external view returns (string memory);
}

contract ERC721 is IERC721, IERC721Metadata, ERC165 {
	string private _name;

	string private _symbol;

	mapping(uint256 => address) private _owners;

	mapping(address => uint256) private _balances;

	mapping(uint256 => address) private _tokenApprovals;

	mapping(address => mapping(address => bool)) private _operatorApprovals;

	constructor(string memory name_, string memory symbol_) {
		_name = name_;
		_symbol = symbol_;
	}

	function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165) returns (bool) {
		return
			interfaceId == type(IERC721).interfaceId ||
			interfaceId == type(IERC721Metadata).interfaceId ||
			super.supportsInterface(interfaceId);
	}

	function balanceOf(address _owner) public view override returns (uint256) {
		require(_owner != address(0), "ERC721: address zero is not a valid owner");
		return _balances[_owner];
	}

	function ownerOf(uint256 _tokenId) public view override returns (address) {
		address owner = _owners[_tokenId];
		require(owner != address(0), "ERC721: invalid token ID");
		return owner;
	}

	function name() public view override returns (string memory) {
		return _name;
	}

	function symbol() public view override returns (string memory) {
		return _symbol;
	}

	function approve(address _approved, uint256 _tokenId) public override payable {
		address owner = ERC721.ownerOf(_tokenId);
		require(_approved != owner, "ERC721: approval to current owner");

		require(
			msg.sender == owner || isApprovedForAll(owner, msg.sender),
			"ERC721: approve caller is not token owner or approved for all"
		);

		_approve(_approved, _tokenId);
	}

	function isApprovedForAll(address _owner, address _operator) public view override returns (bool) {
		return _operatorApprovals[_owner][_operator];
	}

	function getApproved(uint256 _tokenId) public view override returns (address) {
		_requireMinted(_tokenId);
		return _tokenApprovals[_tokenId];
	}

	function setApprovalForAll(address _operator, bool _approved) public override {
		_setApprovalForAll(msg.sender, _operator, _approved);
	}

	function transferFrom(address _from, address _to, uint256 _tokenId) public override payable {
		require(_isApprovedOrOwner(msg.sender, _tokenId), "ERC721: caller is not token owner or approved");
		_transfer(_from, _to, _tokenId);
	}

	function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override payable {
		safeTransferFrom(_from, _to, _tokenId, "");
	}

	function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public override payable {
		require(_isApprovedOrOwner(msg.sender, _tokenId), "ERC721: caller is not token owner or approved");
		_safeTransfer(_from, _to, _tokenId, _data);
	}

	function _approve(address to, uint256 tokenId) internal {
		_tokenApprovals[tokenId] = to;
		emit Approval(ERC721.ownerOf(tokenId), to, tokenId);
	}

	function _requireMinted(uint256 _tokenId) internal view {
		require(_exists(_tokenId), "ERC721: invalid token ID");
	}

	function _exists(uint256 _tokenId) internal view returns (bool) {
		return _owners[_tokenId] != address(0);
	}

	function _setApprovalForAll(address owner, address operator, bool approved) internal {
		require(owner != operator, "ERC721: approve to caller");
		_operatorApprovals[owner][operator] = approved;
		emit ApprovalForAll(owner, operator, approved);
	}

	function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
		address owner = ERC721.ownerOf(tokenId);
		return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
	}

	function _transfer(address from, address to, uint256 tokenId) internal {
		require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
		require(to != address(0), "ERC721: transfer to the zero address");

		delete _tokenApprovals[tokenId];

		_balances[from] -= 1;
		_balances[to] += 1;
		_owners[tokenId] = to;

		emit Transfer(from, to, tokenId);
	}

	function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
		_transfer(from, to, tokenId);
		// check received
	}
}