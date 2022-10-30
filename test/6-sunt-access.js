const chai = require("chai");
const { ethers, deployments} = require("hardhat");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

describe("TTS check router access", function () {
    let usdt, sunt;
    let owner, trader, alice;

    it('Deploy contracts', async () => {
        [owner, trader, alice] = await ethers.getSigners();
        await deployments.fixture();

        const Usdt = await ethers.getContractFactory("MockERC20");
        usdt = await Usdt.deploy("USDT", "USDT", 1000000);
        await usdt.deployed();

        const Sunt = await ethers.getContractFactory("SUNT");
        sunt = await Sunt.deploy();
        await sunt.deployed();
        await sunt.connect(owner).setTrader(trader.address);

    });

    it("Check SUNT: mint illegal access", async () => {
        await expect(sunt.connect(alice).mint(alice.address, 100))
            .to.be.revertedWith('TRADE::onlyTrader: caller is not the trader');
    });

    it("Check SUNT: burn illegal access", async () => {
        await expect(sunt.connect(alice).burn(alice.address, 100))
            .to.be.revertedWith('TRADE::onlyTrader: caller is not the trader');
    });

    it("Check SUNT: setTrader illegal access", async () => {
        await expect(sunt.connect(alice).setTrader(alice.address))
            .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("Check SUNT: mint ok", async () => {
        await sunt.connect(trader).mint(alice.address, 100);
        const alice_balance = await sunt.balanceOf(alice.address);
        expect(alice_balance.toString()).to.be.eq('100')
    });

    it("Check SUNT: burn ok", async () => {
        await sunt.connect(trader).burn(alice.address, 100);
        const alice_balance = await sunt.balanceOf(alice.address);
        expect(alice_balance.toString()).to.be.eq('0')
    });

    it("Check SUNT: setTrader ok", async () => {
        await sunt.connect(owner).setTrader(alice.address);
        expect(await sunt.trader(), alice.address);
        await sunt.connect(alice).mint(alice.address, 100);
        const alice_balance = await sunt.balanceOf(alice.address);
        expect(alice_balance.toString()).to.be.eq('100')
    });

});
