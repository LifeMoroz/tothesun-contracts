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

        data = [usdt.address, 1, [income.address, eve.address], [400, 600], 1000, 0];
    });

    it("Check signatures: bad input arrays dimension", async () => {
        await usdt.connect(alice).approve(router.address, 1000);
        let bad_data = Array.from(data);
        bad_data[3] = [1000];
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...bad_data])
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        await expect(router.connect(alice).routTokens(...bad_data, good_sign))
            .to.be.revertedWith("Router::routTokens: bad input arrays dimension");
    });

    it("Check signatures: values sum != amount", async () => {
        await usdt.connect(alice).approve(router.address, 1500);
        let bad_data = Array.from(data);
        bad_data[4] = 1500;
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...bad_data]);
        const good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        // bad sum
        await expect(router.connect(alice).routTokens(...bad_data, good_sign))
            .to.be.revertedWith("Router::routTokens: values sum != amount");
    });

    it("Check signatures: Router::routTokens: signature is invalid", async () => {
        await usdt.connect(alice).approve(router.address, 1000);
        const messageHash = ethers.utils.solidityKeccak256(types, [alice.address, ...data]);
        const bad_sig = await alice.signMessage(ethers.utils.arrayify(messageHash));
        await expect(router.connect(alice).routTokens(...data, bad_sig))
            .to.be.revertedWith("Router::routTokens: signature is invalid");
    });

});
