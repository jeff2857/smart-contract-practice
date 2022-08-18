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

		return { wallet, addr1, addr2, addr3, addr4, signer1, signer2, signer4, NUM_CONFIRMATIONS_REQUIRED };
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
		it('Should be owner', async () => {
			const { wallet, signer4 } = await loadFixture(deployFixture);

			await expect(wallet.connect(signer4).submitTransaction(signer4.address, 1, '0x')).revertedWith('not owner');
		});

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

		it('Should have 2 transactions', async () => {
			const { wallet, addr4 } = await loadFixture(deployFixture);

			// param type `bytes` only accept parameter starts with '0x'
			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.submitTransaction(addr4, 1, ethers.utils.hexlify(ethers.utils.toUtf8Bytes('hello')));

			expect(await wallet.getTransactionCount()).eq(2);

			const { to, value, data, executed, numConfirmations} = await wallet.getTransaction(1);

			expect(to).eq(addr4);
			expect(value).eq(1);
			expect(ethers.utils.toUtf8String(ethers.utils.arrayify(data))).eq('hello');
			expect(executed).eq(false);
			expect(numConfirmations).eq(0);
		});
	});

	describe('Confirm', function() {
		it('Should tx exist', async () => {
			const { wallet, addr1, addr2, addr4 } = await loadFixture(deployFixture);
		
			await expect(wallet.confirmTransaction(0)).revertedWith('tx does not exist');
		});

		it('Should have 1 confirmation', async () => {
			const { wallet, addr1, addr2, addr4 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.confirmTransaction(0);

			expect(await wallet.isConfirmed(0, addr1)).eq(true);
			expect(await wallet.isConfirmed(0, addr2)).eq(false);

			const transaction = await wallet.getTransaction(0);

			expect(transaction.numConfirmations).eq(1);
			expect(transaction.executed).eq(false);
		});

		it('Should not confirm twice', async () => {
			const { wallet, addr1, signer2, addr4 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.confirmTransaction(0);
		
			await expect(wallet.confirmTransaction(0)).revertedWith('tx already confirmed');
		});

		it('Should have 2 confirmations', async () => {
			const { wallet, addr1, signer2, addr4 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.confirmTransaction(0);
			await wallet.connect(signer2).confirmTransaction(0);

			expect(await wallet.isConfirmed(0, addr1)).eq(true);
			expect(await wallet.connect(signer2).isConfirmed(0, signer2.getAddress())).eq(true);

			const transaction = await wallet.getTransaction(0);

			expect(transaction.numConfirmations).eq(2);
			expect(transaction.executed).eq(false);
		});

		it('Should have 1 confirmation after revoking', async () => {
			const { wallet, addr1, signer2, addr4 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.confirmTransaction(0);
			await wallet.connect(signer2).confirmTransaction(0);

			await wallet.revokeTransaction(0);

			expect(await wallet.isConfirmed(0, addr1)).eq(false);
			expect(await wallet.connect(signer2).isConfirmed(0, signer2.getAddress())).eq(true);

			const transaction = await wallet.getTransaction(0);

			expect(transaction.numConfirmations).eq(1);
			expect(transaction.executed).eq(false);
		});
	});
	
	describe('Execute', function() {
		const ONE_ETH = ethers.utils.parseEther('1');

		it('Should execute failed due to lacking of confirmations', async () => {
			const { wallet, addr4 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.confirmTransaction(0);

			await expect(wallet.executeTransaction(0)).revertedWith('cannot execute tx');
		});

		it('Should execute failed due to insufficient balance', async () => {
			const { wallet, addr4, signer2 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, 1, "0x");
			await wallet.confirmTransaction(0);
			await wallet.connect(signer2).confirmTransaction(0);

			await expect(wallet.executeTransaction(0)).revertedWith('tx failed');
		});

		it('Should execute success', async () => {
			const { wallet, addr4, signer1, signer2, signer4 } = await loadFixture(deployFixture);

			await wallet.submitTransaction(addr4, ONE_ETH, "0x");
			await wallet.confirmTransaction(0);
			await wallet.connect(signer2).confirmTransaction(0);

			await signer1.sendTransaction({
				to: wallet.address,
				value: ONE_ETH,
			});

			const wallet_balance_before = await ethers.provider.getBalance(wallet.address);
			const signer4_balance_before = await signer4.getBalance();

			await wallet.executeTransaction(0);

			const signer4_balance_after = await signer4.getBalance();

			expect(signer4_balance_after.sub(signer4_balance_before)).eq(ONE_ETH);

			const wallet_balance_after = await ethers.provider.getBalance(wallet.address);
			expect(wallet_balance_before.sub(wallet_balance_after)).eq(ONE_ETH);

			const transaction = await wallet.getTransaction(0);

			expect(transaction.executed).eq(true);
		});
	});
});