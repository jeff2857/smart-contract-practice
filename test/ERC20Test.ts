import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe('ERC20', () => {
	async function deployERC20Fixture() {
		const NAME = 'TTK';
		const SYMBOL = 'Test Token';
		const DECIMAL = 0;
		const INIT_SUPPLY = 100;

		const [signer1, signer2, signer3] = await ethers.getSigners();

		const Ttk = await ethers.getContractFactory('ERC20Test');
		const ttk = await Ttk.deploy(NAME, SYMBOL, INIT_SUPPLY, DECIMAL);

		return { NAME, SYMBOL, DECIMAL, INIT_SUPPLY, signer1, signer2, signer3, ttk };
	}

	describe('Deployment', () => {
		it('Should set the right init params', async () => {
			const { NAME, SYMBOL, DECIMAL, INIT_SUPPLY, signer1, signer2, ttk } = await loadFixture(deployERC20Fixture);

			expect(await ttk.name()).eq(NAME);
			expect(await ttk.symbol()).eq(SYMBOL);
			expect(await ttk.decimal()).eq(DECIMAL);
			expect(await ttk.totalSupply()).eq(INIT_SUPPLY);
			expect(await ttk.balanceOf(signer1.address)).eq(INIT_SUPPLY);
			expect(await ttk.balanceOf(signer2.address)).eq(0);
		});
	});

	describe('Transfer', () => {
		it('Should transfer successfully', async () => {
			const { signer1, signer2, ttk } = await loadFixture(deployERC20Fixture);

			await ttk.transfer(signer2.address, 23);

			expect(await ttk.balanceOf(signer1.address)).eq(77);
			expect(await ttk.balanceOf(signer2.address)).eq(23);
		});

		it('Should transfer failed due to insufficient balance', async () => {
			const { signer2, ttk } = await loadFixture(deployERC20Fixture);

			await expect(ttk.transfer(signer2.address, 200)).revertedWith("ERC20: insufficient balance");
		});

		it('Should transfer failed due to zero address', async () => {
			const { signer2, ttk } = await loadFixture(deployERC20Fixture);

			await expect(ttk.transfer(ethers.constants.AddressZero, 23)).revertedWith("ERC20: transfer to the zero address");
		});
	});

	describe('Approve', () => {
		it('Should approved successfully', async () => {
			const { signer1, signer2, ttk } = await loadFixture(deployERC20Fixture);

			await ttk.approve(signer2.address, 23);

			expect(await ttk.allowance(signer1.address, signer2.address)).eq(23);
		});

		it('Should approved failed due to invalid amount', async () => {
			const { signer2, ttk } = await loadFixture(deployERC20Fixture);

			await expect(ttk.approve(signer2.address, 200)).revertedWith("ERC20: approve amount greater than balance");
		});

		it('Should transferFrom successfully', async () => {
			const { signer1, signer2, ttk } = await loadFixture(deployERC20Fixture);

			await ttk.approve(signer2.address, 23);
			await ttk.connect(signer2).transferFrom(signer1.address, signer2.address, 23);

			expect(await ttk.balanceOf(signer1.address)).eq(77);
			expect(await ttk.balanceOf(signer2.address)).eq(23);
		});
	});
});