import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigWallet", function() {
	async function deployFixture() {
		const NUM_CONFIRMATIONS_REQUIRED = 2;

		const [signer1, signer2, signer3, signer4] = await ethers.getSigners();
		const addr1 = await signer1.getAddress();
		const addr2 = await signer2.getAddress();
		const addr3 = await signer3.getAddress();
		const addr4 = await signer4.getAddress();

		const Wallet = await ethers.getContractFactory('MultiSigWallet');
		const wallet = await Wallet.deploy([addr1, addr2, addr3], NUM_CONFIRMATIONS_REQUIRED);

		return { wallet, addr1, addr2, addr3, addr4, NUM_CONFIRMATIONS_REQUIRED };
	}

	describe('Deployment', function() {
		it('Should have 3 owners', async function() {
			const { wallet } = await loadFixture(deployFixture);
			
			expect((await wallet.getOwners()).length).eq(3);
		});

		it('Should have 0 transaction', async function() {
			const { wallet } = await loadFixture(deployFixture);

			expect(await wallet.getTransactionCount()).eq(0);
		});

		it('Should have 2 required confirmations', async () => {
			const { wallet } = await loadFixture(deployFixture);

			expect(await wallet.numConfirmationsRequired()).eq(2);
		});
	});

	describe('Submit', function() {
		it('Should have 1 transaction', async () => {
			const { wallet, addr4 } = await loadFixture(deployFixture);

			// param type `bytes` only accept parameter starts with '0x'
			await wallet.submitTransaction(addr4, 1, "0x");

			expect(await wallet.getTransactionCount()).eq(1);

			const { to, value, data, executed, numConfirmations} = await wallet.getTransaction(0);

			expect(to).eq(addr4);
			expect(value).eq(1);
			expect(data).eq("0x");
			expect(executed).eq(false);
			expect(numConfirmations).eq(0);
		});
	});

	describe('Confirm', function() {
	});
	
	describe('Execute', function() {
	});
});