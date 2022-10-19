const chai = require("chai");
const { ethers, deployments} = require("hardhat");
const { solidity } = require("ethereum-waffle");
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

        // send to alice
        await usdt.connect(owner).transfer(alice.address, 1000000);
        await sunt.connect(owner).transfer(trade.address, 1000000);

        data = [usdt.address, 2, [vault.address, income.address, bob.address, eve.address], [1000, 40, 20, 40], 1100, 0];
    });

    it("Check investment: token not allowed", async () => {
        await usdt.connect(alice).approve(router.address, 1100);
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await expect(router.connect(alice).routTokens(...data, good_sign))
            .to.be.revertedWith("TRADE::buy: token is not allowed");
    });

    it("Check investment: success", async () => {
        await trade.connect(owner).allow(usdt.address);
        await usdt.connect(alice).approve(router.address, 1100);
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await router.connect(alice).routTokens(...data, good_sign);

        const alice_balance = await sunt.balanceOf(alice.address);
        const vault_balance = await usdt.balanceOf(vault.address );
        const income_balance = await usdt.balanceOf(income.address);
        const bob_balance = await usdt.balanceOf(bob.address);
        const eve_balance = await usdt.balanceOf(eve.address);

        expect(alice_balance.toString()).to.be.eq('1000')
        expect(vault_balance.toString()).to.be.eq('1000');
        expect(income_balance.toString()).to.be.eq('40');
        expect(bob_balance.toString()).to.be.eq('20');
        expect(eve_balance.toString()).to.be.eq('40');
    });

    it("Check investment: deduplication fail", async () => {
        await usdt.connect(alice).approve(router.address, 1100);

        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...data])
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));

        await expect(router.connect(alice).routTokens(...data, good_sign))
            .to.be.revertedWith("Router::routTokens: deduplication fail");
    });

    it("Check investment: deduplication ok", async () => {
        await usdt.connect(alice).approve(router.address, 1100);
        let _data = Array.from(data);
        _data[5] = 1;
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ..._data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await router.connect(alice).routTokens(..._data, good_sign);

        const alice_balance = await sunt.balanceOf(alice.address);
        const vault_balance = await usdt.balanceOf(vault.address );
        const income_balance = await usdt.balanceOf(income.address);
        const bob_balance = await usdt.balanceOf(bob.address);
        const eve_balance = await usdt.balanceOf(eve.address);

        expect(alice_balance.toString()).to.be.eq('2000')
        expect(vault_balance.toString()).to.be.eq('2000');
        expect(income_balance.toString()).to.be.eq('80');
        expect(bob_balance.toString()).to.be.eq('40');
        expect(eve_balance.toString()).to.be.eq('80');
    });

});
