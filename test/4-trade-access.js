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
    });

    it("Check Trade: setVault illegal access", async () => {
        await expect(trade.connect(alice).setVault(alice.address))
            .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("Check Trade: setVault ok", async () => {
        await trade.connect(owner).setVault(alice.address);
        const allowed = await trade.vault();
        expect(allowed).to.be.eq(alice.address);
    });

    it("Check Trade: allow illegal access", async () => {
        await expect(trade.connect(alice).allow(usdt.address))
            .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("Check Trade: allow ok", async () => {
        await trade.connect(owner).allow(usdt.address);
        const allowed_tokens = await trade.allowed_tokens(usdt.address);
        expect(allowed_tokens).to.be.eq(true);
    });

    it("Check Trade: disallow illegal access", async () => {
        await expect(trade.connect(alice).disallow(usdt.address))
            .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("Check Trade: disallow ok", async () => {
        await trade.connect(owner).disallow(usdt.address);
        const allowed_tokens = await trade.allowed_tokens(usdt.address);
        expect(allowed_tokens).to.be.eq(false);
    });

});
