const chai = require("chai");
const { ethers, deployments} = require("hardhat");
const { solidity } = require("ethereum-waffle");
const {tags} = require("../deploy/deploy-all");
chai.use(solidity);
const { expect } = chai;

describe("TTS ecosystem test", function () {
    let usdt, router, sunt, trade;
    let owner, vault, income, alice, bob, carl, eve;
    const types = ['address', 'address', 'uint256', 'address[]', 'uint256[]', 'uint256', 'uint256']
    let data;

    it('Deploy contracts', async () => {
        [owner, vault, income, alice, bob, carl, eve] = await ethers.getSigners();
        await deployments.fixture();

        const Usdt = await ethers.getContractFactory("MockERC20");
        usdt = await Usdt.deploy("USDT", "USDT", 1000000);
        await usdt.deployed();

        const Sunt = await ethers.getContractFactory("SUNT");
        sunt = await Sunt.deploy(owner.address, 1000000);
        await sunt.deployed();

        const Trade = await ethers.getContractFactory("Trade");
        trade = await Trade.deploy(sunt.address, vault.address);
        await trade.deployed();

        const Router = await ethers.getContractFactory("Router");
        router = await Router.deploy(trade.address)
        await router.deployed();

        // Set signer to owner
        await router.connect(owner).setSigner(owner.address);
        // allow trade to take vault usdt
        await usdt.connect(vault).approve(trade.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935');

        // send to alice
        await usdt.connect(owner).transfer(alice.address, 1100);
        await sunt.connect(owner).transfer(trade.address, 1000);
        await sunt.connect(alice).approve(trade.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935');

        data = [usdt.address, 2, [vault.address, income.address, bob.address, eve.address], [1000, 40, 20, 40], 1100, 0];
    });

    it("Check withdraw: success", async () => {
        await trade.connect(owner).allow(usdt.address);
        await usdt.connect(alice).approve(router.address, 1100);
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await router.connect(alice).routTokens(...data, good_sign);

        await trade.connect(vault).sellFrom(usdt.address, alice.address, '1000');

        const alice_balance_sunt = await sunt.balanceOf(alice.address);
        const alice_balance_usdt = await usdt.balanceOf(alice.address);
        const vault_balance = await usdt.balanceOf(vault.address);
        const trade_balance = await sunt.balanceOf(trade.address);
        const income_balance = await usdt.balanceOf(income.address);
        const bob_balance = await usdt.balanceOf(bob.address);
        const eve_balance = await usdt.balanceOf(eve.address);

        expect(alice_balance_usdt.toString()).to.be.eq('1000')
        expect(alice_balance_sunt.toString()).to.be.eq('0')
        expect(vault_balance.toString()).to.be.eq('0');
        expect(trade_balance.toString()).to.be.eq('1000');
        expect(income_balance.toString()).to.be.eq('40');
        expect(bob_balance.toString()).to.be.eq('20');
        expect(eve_balance.toString()).to.be.eq('40');
    });


    it("Check withdraw: illegal access", async () => {
        await usdt.connect(owner).transfer(alice.address, 100);
        await trade.connect(owner).allow(usdt.address);
        await usdt.connect(alice).approve(router.address, 1100);
        let _data = Array.from(data);
        _data[5] = 1;
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ..._data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await router.connect(alice).routTokens(..._data, good_sign);

        await expect(trade.connect(alice).sellFrom(usdt.address, alice.address, '1000'))
            .to.be.revertedWith('TRADE::sellFrom: caller is not the vault');
    });

    it("Check withdraw: illegal token", async () => {
        await usdt.connect(owner).transfer(alice.address, 1100);
        await sunt.connect(owner).transfer(trade.address, 1000);

        await usdt.connect(alice).approve(router.address, 1100);
        let _data = Array.from(data);
        _data[5] = 2;
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ..._data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await router.connect(alice).routTokens(..._data, good_sign);

        await trade.connect(owner).disallow(usdt.address);
        await expect(trade.connect(alice).sellFrom(usdt.address, alice.address, '1000'))
            .to.be.revertedWith('TRADE::sellFrom: token is not allowed');
    });

});
